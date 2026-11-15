import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { serialize } from 'next-mdx-remote-client/serialize'
import remarkGfm from 'remark-gfm'
import { getDocHref } from '../lib/get-doc-route.ts'
import { getPrivateContentRoot } from '../lib/local-content-paths.ts'
import { parseLocalDocument } from '../lib/local-document-parser.ts'
import { getFrontmatterIssues, parseFrontmatter } from './validate-content.mjs'

const GITHUB_HOST_KEY =
    '[ssh.github.com]:443 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl\n'
const CONTENT_PATH = /^(?:category|data)\//
const MARKDOWN_PATH = /\.(?:md|mdx)$/
const SAFE_PATH = /^(?:[\w-]+\/)*[\w-]+(?:\.[\w-]+)+$/

function readAssetReference(fileName, reference) {
    if (/^(?:https?:\/\/|data:)/i.test(reference)) return null

    const pathname = reference.split(/[?#]/, 1)[0]
    const target = pathname.startsWith('/')
        ? `public${pathname}`
        : path.posix.normalize(
              path.posix.join(path.posix.dirname(fileName), pathname)
          )

    if (!target.startsWith('public/') || !SAFE_PATH.test(target)) {
        throw new Error(`${fileName}: invalid local image or asset reference`)
    }
    return target
}

async function listArticleAssets(fileName, document, frontmatter) {
    const references = new Set()
    const definitions = new Map()
    const imageReferences = new Set()
    if (frontmatter.thumbnail) references.add(document.thumbnail)

    function visit(node) {
        if (node.type === 'image') references.add(node.url)
        if (node.type === 'definition')
            definitions.set(node.identifier, node.url)
        if (node.type === 'imageReference') imageReferences.add(node.identifier)
        if (node.type === 'link' && node.url.startsWith('/licenses/')) {
            references.add(node.url)
        }
        if (
            (node.type === 'mdxJsxFlowElement' ||
                node.type === 'mdxJsxTextElement') &&
            (node.name === 'img' || node.name === 'Image')
        ) {
            const source = node.attributes.find(
                (attribute) => attribute.name === 'src'
            )
            if (typeof source?.value !== 'string') {
                throw new Error('Image src must be a literal string')
            }
            references.add(source.value)
        }
        node.children?.forEach(visit)
    }

    const result = await serialize({
        source: document.content,
        options: { mdxOptions: { remarkPlugins: [remarkGfm, () => visit] } },
    })
    if (result.error) {
        throw new Error(`${fileName}: ${result.error.message}`)
    }
    for (const identifier of imageReferences) {
        const reference = definitions.get(identifier)
        if (!reference)
            throw new Error(`${fileName}: undefined image reference`)
        references.add(reference)
    }
    return [...references]
        .map((reference) => readAssetReference(fileName, reference))
        .filter(Boolean)
}

function listGitFiles(git, revision) {
    return new Map(
        git(['ls-tree', '-rz', revision], 'utf8')
            .split('\0')
            .filter(Boolean)
            .map((entry) => {
                const separator = entry.indexOf('\t')
                return [
                    entry.slice(separator + 1),
                    entry.slice(0, separator).split(' '),
                ]
            })
    )
}

export async function stagePrivateContent(appRoot, lock, git) {
    const entries = listGitFiles(git, lock.revision)
    if (
        new Set(lock.retainedRemoteRoutes).size !==
        lock.retainedRemoteRoutes.length
    ) {
        throw new Error('Duplicate retained remote routes in the content lock')
    }
    const files = new Map()
    const routes = new Map(
        lock.retainedRemoteRoutes.map((route) => [route, 'remote API'])
    )
    const assets = new Map()
    const readFile = (name) => {
        const [mode, type] = entries.get(name) ?? []
        if (!SAFE_PATH.test(name) || mode !== '100644' || type !== 'blob') {
            throw new Error(
                `Expected a regular file in the pinned content revision: ${name}`
            )
        }
        return git(['show', `${lock.revision}:${name}`])
    }

    for (const name of entries.keys()) {
        if (!CONTENT_PATH.test(name)) continue
        if (!MARKDOWN_PATH.test(name)) {
            throw new Error(
                `Only Markdown or MDX is allowed in content directories: ${name}`
            )
        }

        const bytes = readFile(name)
        const raw = bytes.toString('utf8')
        const frontmatter = parseFrontmatter(raw)
        if (!frontmatter) throw new Error(`${name}: frontmatter is required`)
        const issues = getFrontmatterIssues(frontmatter)
        if (issues.length) throw new Error(`${name}: ${issues.join(', ')}`)
        const document = parseLocalDocument(
            name,
            name.replace(MARKDOWN_PATH, ''),
            raw
        )
        if (!document) continue

        const route = getDocHref(document)
        if (routes.has(route)) {
            throw new Error(
                `Duplicate published URL ${route}: ${routes.get(route)}, ${name}`
            )
        }
        routes.set(route, name)
        files.set(name, bytes)
        for (const asset of await listArticleAssets(
            name,
            document,
            frontmatter
        )) {
            if (!assets.has(asset)) assets.set(asset, readFile(asset))
        }
    }

    const actual = [...routes.keys()]
        .filter((route) => !lock.retainedRemoteRoutes.includes(route))
        .sort()
    const expected = [...lock.routes].sort()
    if (!actual.length || JSON.stringify(actual) !== JSON.stringify(expected)) {
        const missing = expected.filter((route) => !actual.includes(route))
        const extra = actual.filter((route) => !expected.includes(route))
        throw new Error(
            `Published routes differ from the lock (missing: ${missing.join(', ')}, extra: ${extra.join(', ')})`
        )
    }

    for (const [name, bytes] of assets) {
        const target = path.join(appRoot, name)
        if (fs.existsSync(target) && !fs.readFileSync(target).equals(bytes)) {
            throw new Error(
                `Content asset conflicts with an app public file: ${name}`
            )
        }
    }

    const contentRoot = getPrivateContentRoot(appRoot, lock.revision)
    fs.rmSync(contentRoot, { recursive: true, force: true })
    for (const [root, entries] of [
        [contentRoot, files],
        [appRoot, assets],
    ]) {
        for (const [name, bytes] of entries) {
            const target = path.join(root, name)
            if (root === appRoot && fs.existsSync(target)) continue
            fs.mkdirSync(path.dirname(target), { recursive: true })
            fs.writeFileSync(target, bytes)
        }
    }
    return { documentCount: files.size, assetCount: assets.size }
}

export async function preparePrivateContent(appRoot, env) {
    if (env.DOCS_PRIVATE_CONTENT_ENABLED !== '1') return undefined
    if (env.VERCEL_ENV !== 'preview') {
        throw new Error('Private content is enabled for Preview builds only')
    }
    const key = env.DOCS_PRIVATE_CONTENT_SSH_KEY?.trim()
    if (!key)
        throw new Error(
            'DOCS_PRIVATE_CONTENT_SSH_KEY is required for this Preview'
        )

    const lock = JSON.parse(
        fs.readFileSync(path.join(appRoot, 'content-preview.lock.json'), 'utf8')
    )
    const repository = /^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\.git$/.exec(
        lock.repository
    )
    if (!repository || !/^[a-f0-9]{40}$/.test(lock.revision)) {
        throw new Error('Invalid private content repository or pinned SHA')
    }

    const checkout = fs.mkdtempSync(
        path.join(os.tmpdir(), 'heap-forge-content-')
    )
    try {
        fs.writeFileSync(path.join(checkout, 'id_ed25519'), `${key}\n`, {
            mode: 0o600,
        })
        fs.writeFileSync(path.join(checkout, 'known_hosts'), GITHUB_HOST_KEY, {
            mode: 0o600,
        })
        const gitEnv = {
            ...env,
            GIT_CONFIG_NOSYSTEM: '1',
            GIT_CONFIG_GLOBAL: '/dev/null',
            GIT_TERMINAL_PROMPT: '0',
            GIT_SSH_COMMAND:
                'ssh -F /dev/null -i ./id_ed25519 -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=./known_hosts -o ConnectTimeout=12',
        }
        delete gitEnv.DOCS_PRIVATE_CONTENT_SSH_KEY
        const git = (args, encoding) =>
            execFileSync('git', args, {
                cwd: checkout,
                env: gitEnv,
                encoding,
                maxBuffer: 20 * 1024 * 1024,
                timeout: 45000,
            })

        git(['init', '--bare', '--quiet'])
        try {
            git([
                'fetch',
                '--quiet',
                '--no-tags',
                '--depth=1',
                '--',
                `ssh://git@ssh.github.com:443/${repository[1]}.git`,
                lock.revision,
            ])
        } catch {
            throw new Error(
                'Could not fetch the pinned private content revision with the Preview deploy key'
            )
        }
        if (git(['rev-parse', 'FETCH_HEAD'], 'utf8').trim() !== lock.revision) {
            throw new Error(
                'The fetched private content revision differs from the lock'
            )
        }
        const { documentCount, assetCount } = await stagePrivateContent(
            appRoot,
            lock,
            git
        )
        console.log(
            `[docs] Prepared private content ${lock.revision}: ${documentCount} published documents, ${assetCount} referenced assets.`
        )
        return lock.revision
    } finally {
        fs.rmSync(checkout, { recursive: true, force: true })
    }
}
