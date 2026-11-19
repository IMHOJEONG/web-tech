import { execFileSync } from 'node:child_process'
import { isUtf8 } from 'node:buffer'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { serialize } from 'next-mdx-remote-client/serialize'
import remarkGfm from 'remark-gfm'
import { inspect, readReviews } from '../../../scripts/check-publication.mts'
import { getContentDeliveryMode } from '../lib/content-delivery-mode.ts'
import { getDocHref } from '../lib/get-doc-route.ts'
import { getPrivateContentRoot } from '../lib/local-content-paths.ts'
import { parseLocalDocument } from '../lib/local-document-parser.ts'
import { normalizePublicImageSource } from '../lib/rehype-public-images.ts'
import { getFrontmatterIssues, parseFrontmatter } from './validate-content.mjs'
import { getContentStyleIssues } from './validate-content-style.mjs'

const GITHUB_HOST_KEY =
    '[ssh.github.com]:443 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl\n'
const SAFE_PATH = /^(?:[\w-]+\/)*[\w-]+(?:\.[\w-]+)+$/
const MAX_FILE_BYTES = 8 * 1024 * 1024
const MAX_RELEASE_BYTES = 32 * 1024 * 1024
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex')

export type ContentRelease = {
    version: 1
    repository: string
    revision: string
    routes: string[]
}
export type GitReader = (args: string[]) => Buffer
type GitCommand = (
    args: string[],
    options: {
        cwd: string
        env: NodeJS.ProcessEnv
        timeout: number
        maxBuffer: number
        stdio: ['ignore', 'pipe', 'pipe']
    }
) => Buffer
type Reviews = ReturnType<typeof readReviews>
type AstNode = {
    type: string
    url?: string
    identifier?: string
    name?: string
    attributes?: { name?: string; value?: unknown }[]
    children?: AstNode[]
}

export function parseContentRelease(value: unknown): ContentRelease {
    const release = value as ContentRelease
    if (
        !release ||
        Object.keys(release).sort().join(',') !==
            'repository,revision,routes,version' ||
        release.version !== 1 ||
        typeof release.repository !== 'string' ||
        !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\.git$/.test(
            release.repository
        ) ||
        !/^[a-f0-9]{40}$/.test(release.revision) ||
        !Array.isArray(release.routes) ||
        !release.routes.length ||
        release.routes.length > 1000 ||
        new Set(release.routes).size !== release.routes.length ||
        !release.routes.every(
            (route) =>
                typeof route === 'string' &&
                /^\/docs\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)*[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
                    route
                )
        )
    ) {
        throw new Error('Invalid content release lock')
    }
    return release
}

function safeTarget(root: string, name: string) {
    if (!SAFE_PATH.test(name.replace(/^\.generated-content\//, ''))) {
        throw new Error('Unsafe content path')
    }
    let current = root
    for (const segment of name.split('/')) {
        current = path.join(current, segment)
        if (
            fs.lstatSync(current, { throwIfNoEntry: false })?.isSymbolicLink()
        ) {
            throw new Error('Content targets must not be symbolic links')
        }
    }
    return current
}

async function articleAssets(source: string, thumbnail: unknown) {
    const references = new Set<string>()
    const definitions = new Map<string, string>()
    const imageReferences = new Set<string>()
    if (typeof thumbnail === 'string' && thumbnail.trim()) {
        references.add(thumbnail)
    }
    function visit(node: AstNode) {
        if (node.type === 'image' && node.url) references.add(node.url)
        if (node.type === 'definition' && node.identifier && node.url) {
            definitions.set(node.identifier, node.url)
        }
        if (node.type === 'imageReference' && node.identifier) {
            imageReferences.add(node.identifier)
        }
        if (node.type === 'link' && node.url?.startsWith('/licenses/')) {
            references.add(node.url)
        }
        if (
            ['mdxJsxFlowElement', 'mdxJsxTextElement'].includes(node.type) &&
            ['img', 'Image', 'video', 'source', 'audio'].includes(
                node.name ?? ''
            )
        ) {
            for (const attribute of node.attributes ?? []) {
                if (
                    !['src', 'poster', 'srcSet'].includes(attribute.name ?? '')
                ) {
                    continue
                }
                if (
                    attribute.name === 'srcSet' ||
                    typeof attribute.value !== 'string'
                ) {
                    throw new Error('Media references must be literal URLs')
                }
                references.add(attribute.value)
            }
        }
        node.children?.forEach(visit)
    }
    try {
        const result = await serialize({
            source,
            options: {
                mdxOptions: {
                    remarkPlugins: [
                        remarkGfm,
                        () => (tree) => visit(tree as AstNode),
                    ],
                },
            },
        })
        if ('error' in result) throw result.error
    } catch {
        throw new Error('Content syntax or media references are invalid')
    }
    for (const identifier of imageReferences) {
        const reference = definitions.get(identifier)
        if (!reference) throw new Error('Undefined image reference')
        references.add(reference)
    }
    return [...references].flatMap((reference) => {
        if (/^https:\/\//i.test(reference)) return []
        reference = normalizePublicImageSource(reference)
        // NAS-style relative URLs need an explicit content migration first.
        if (!reference.startsWith('/') || reference.startsWith('//')) {
            throw new Error('Local media must use an absolute public path')
        }
        const target = `public${reference.split(/[?#]/, 1)[0]}`
        if (!SAFE_PATH.test(target)) throw new Error('Unsafe asset reference')
        return [target]
    })
}

export async function stagePrivateContent(
    appRoot: string,
    input: unknown,
    git: GitReader,
    reviews: Reviews
) {
    const release = parseContentRelease(input)
    const tree = git(['ls-tree', '-rz', release.revision])
    if (tree.length > MAX_FILE_BYTES) throw new Error('Content tree too large')
    const entries = new Map(
        tree
            .toString('utf8')
            .split('\0')
            .filter(Boolean)
            .map((entry) => {
                const separator = entry.indexOf('\t')
                return [entry.slice(separator + 1), entry.slice(0, separator)]
            })
    )
    const documents = new Map<string, Buffer>()
    const assets = new Map<string, Buffer>()
    const routes = new Set<string>()
    let totalBytes = 0
    function read(name: string) {
        if (
            !SAFE_PATH.test(name) ||
            !entries.get(name)?.startsWith('100644 blob ')
        ) {
            throw new Error('Expected a regular content file')
        }
        const bytes = git(['show', `${release.revision}:${name}`])
        totalBytes += bytes.length
        if (bytes.length > MAX_FILE_BYTES || totalBytes > MAX_RELEASE_BYTES) {
            throw new Error('Content byte budget exceeded')
        }
        return bytes
    }
    function reviewed(name: string, bytes: Buffer) {
        const findings = inspect(`apps/docs/${name}`, bytes, '100644', reviews)
        if (findings.length) {
            // Do not print a private path, source text, or parser diagnostics.
            throw new Error(
                `Content publication denied: ${[...new Set(findings.map((item) => item.rule))].join(', ')}`
            )
        }
    }
    for (const name of entries.keys()) {
        if (!/^(?:category|data)\//.test(name)) continue
        if (!/\.(?:md|mdx)$/.test(name)) {
            throw new Error('Only Markdown files are allowed in content roots')
        }
        const bytes = read(name)
        if (!isUtf8(bytes)) throw new Error('Content must be UTF-8')
        const raw = bytes.toString('utf8')
        const frontmatter = parseFrontmatter(raw) as Record<
            string,
            unknown
        > | null
        if (!frontmatter) throw new Error('Content frontmatter is required')
        // A draft is never staged, even if somebody accidentally reviewed it.
        if (
            frontmatter.status === 'draft' ||
            frontmatter.status === 'archived'
        ) {
            continue
        }
        reviewed(name, bytes)
        if (
            getFrontmatterIssues(frontmatter).length ||
            getContentStyleIssues(raw, frontmatter).failures.length
        ) {
            throw new Error('Content authoring validation failed')
        }
        let document
        try {
            document = parseLocalDocument(
                name,
                name.replace(/\.(md|mdx)$/, ''),
                raw
            )
        } catch {
            throw new Error('Content metadata validation failed')
        }
        if (!document) throw new Error('Expected published content')
        const route = getDocHref(document)
        if (routes.has(route)) throw new Error('Duplicate published route')
        routes.add(route)
        documents.set(name, bytes)
        for (const asset of await articleAssets(
            document.content,
            frontmatter.thumbnail ? document.thumbnail : undefined
        )) {
            if (assets.has(asset)) continue
            const bytes = read(asset)
            reviewed(asset, bytes)
            assets.set(asset, bytes)
        }
    }
    if (
        JSON.stringify([...routes].sort()) !==
        JSON.stringify([...release.routes].sort())
    ) {
        throw new Error('Published routes differ from the release lock')
    }
    // Validate every write before publishing any part of the release.
    for (const [name, bytes] of assets) {
        const target = safeTarget(appRoot, name)
        if (fs.existsSync(target) && !fs.readFileSync(target).equals(bytes)) {
            throw new Error('Content asset conflicts with an application file')
        }
    }
    const ownershipFile = safeTarget(appRoot, '.generated-content/assets.json')
    const owned: { path: string; sha256: string }[] = fs.existsSync(
        ownershipFile
    )
        ? JSON.parse(fs.readFileSync(ownershipFile, 'utf8'))
        : []
    if (
        !Array.isArray(owned) ||
        owned.some(
            (entry) =>
                !entry ||
                !/^public\//.test(entry.path) ||
                !SAFE_PATH.test(entry.path) ||
                !/^[a-f0-9]{64}$/.test(entry.sha256)
        )
    ) {
        throw new Error('Invalid generated asset ownership record')
    }
    for (const entry of owned) {
        const target = safeTarget(appRoot, entry.path)
        if (
            fs.existsSync(target) &&
            hash(fs.readFileSync(target)) !== entry.sha256
        ) {
            throw new Error('A generated asset was changed outside the release')
        }
    }
    const root = getPrivateContentRoot(appRoot, release.revision)
    safeTarget(appRoot, `.generated-content/${release.revision}/ready.json`)
    fs.mkdirSync(path.dirname(root), { recursive: true })
    const temporary = fs.mkdtempSync(path.join(path.dirname(root), 'staging-'))
    const created: { target: string; dev: number; ino: number }[] = []
    try {
        for (const directory of ['data', 'category']) {
            fs.mkdirSync(path.join(temporary, directory))
        }
        for (const [name, bytes] of documents) {
            const target = path.join(temporary, name)
            fs.mkdirSync(path.dirname(target), { recursive: true })
            fs.writeFileSync(target, bytes)
        }
        fs.writeFileSync(
            path.join(temporary, 'ready.json'),
            JSON.stringify({
                revision: release.revision,
                files: [...documents].map(([name, bytes]) => ({
                    path: name,
                    sha256: hash(bytes),
                })),
            })
        )
        if (fs.existsSync(root)) fs.rmSync(root, { recursive: true })
        fs.renameSync(temporary, root)
        for (const entry of owned) {
            if (!assets.has(entry.path)) {
                fs.rmSync(safeTarget(appRoot, entry.path), { force: true })
            }
        }
        const nextOwned = owned.filter((entry) => assets.has(entry.path))
        for (const [name, bytes] of assets) {
            const target = safeTarget(appRoot, name)
            if (fs.existsSync(target)) continue
            fs.mkdirSync(path.dirname(target), { recursive: true })
            const descriptor = fs.openSync(target, 'wx')
            try {
                const { dev, ino } = fs.fstatSync(descriptor)
                created.push({ target, dev, ino })
                fs.writeFileSync(descriptor, bytes)
            } finally {
                fs.closeSync(descriptor)
            }
            nextOwned.push({ path: name, sha256: hash(bytes) })
        }
        fs.writeFileSync(ownershipFile, JSON.stringify(nextOwned))
    } catch (error) {
        // Never remove a pre-existing file or a path replaced by another writer.
        for (const { target, dev, ino } of created) {
            const current = fs.lstatSync(target, { throwIfNoEntry: false })
            if (current?.dev === dev && current.ino === ino) {
                fs.unlinkSync(target)
            }
        }
        throw error
    } finally {
        fs.rmSync(temporary, { recursive: true, force: true })
    }
    return { documentCount: documents.size, assetCount: assets.size }
}

export async function preparePrivateContent(
    appRoot: string,
    env: Record<string, string | undefined>,
    runGit: GitCommand = (args, options) => execFileSync('git', args, options)
) {
    if (getContentDeliveryMode(env) !== 'private-git') return undefined
    const release = parseContentRelease(
        JSON.parse(
            fs.readFileSync(
                path.join(appRoot, 'content-release.lock.json'),
                'utf8'
            )
        )
    )
    if (
        env.DOCS_PRIVATE_CONTENT_REVISION !== undefined &&
        env.DOCS_PRIVATE_CONTENT_REVISION !== release.revision
    ) {
        throw new Error('Configured content revision does not match the lock')
    }
    const key = env.DOCS_PRIVATE_CONTENT_SSH_KEY?.trim()
    if (!key)
        throw new Error('Private content read-only deploy key is required')
    const checkout = fs.mkdtempSync(
        path.join(os.tmpdir(), 'docs-content-fetch-')
    )
    try {
        fs.chmodSync(checkout, 0o700)
        fs.writeFileSync(path.join(checkout, 'identity'), `${key}\n`, {
            mode: 0o600,
        })
        fs.writeFileSync(path.join(checkout, 'known_hosts'), GITHUB_HOST_KEY, {
            mode: 0o600,
        })
        // Do not inherit user credential helpers, Git config, hooks, or NAS tokens.
        const gitEnv = {
            PATH: env.PATH,
            NODE_ENV: 'production' as const,
            HOME: checkout,
            GIT_CONFIG_NOSYSTEM: '1',
            GIT_CONFIG_GLOBAL: '/dev/null',
            GIT_TERMINAL_PROMPT: '0',
            GIT_SSH_COMMAND:
                'ssh -F /dev/null -i ./identity -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=./known_hosts -o ConnectTimeout=12',
        }
        const git: GitReader = (args) =>
            runGit(args, {
                cwd: checkout,
                env: gitEnv,
                timeout: 45000,
                maxBuffer: MAX_RELEASE_BYTES,
                stdio: ['ignore', 'pipe', 'pipe'],
            })
        try {
            git(['init', '--bare', '--quiet'])
            git([
                'fetch',
                '--quiet',
                '--no-tags',
                '--depth=1',
                '--',
                release.repository.replace(
                    'https://github.com/',
                    'ssh://git@ssh.github.com:443/'
                ),
                release.revision,
            ])
        } catch {
            throw new Error(
                'Could not fetch the pinned private content revision'
            )
        }
        if (
            git(['rev-parse', 'FETCH_HEAD']).toString('utf8').trim() !==
            release.revision
        ) {
            throw new Error('Fetched content revision does not match the lock')
        }
        const entries = git(['ls-tree', '--name-only', release.revision])
            .toString('utf8')
            .split('\n')
        // The private repository owns future review records. Existing public
        // reviews are only a migration bridge for already-approved bytes.
        const reviewBytes = entries.includes('.publication-review.json')
            ? git(['show', `${release.revision}:.publication-review.json`])
            : fs.readFileSync(
                  path.join(appRoot, '../../.publication-review.json')
              )
        const result = await stagePrivateContent(
            appRoot,
            release,
            git,
            readReviews(reviewBytes)
        )
        console.info('[docs.content_release]', {
            revision: release.revision,
            ...result,
        })
        return release.revision
    } finally {
        fs.rmSync(checkout, { recursive: true, force: true })
    }
}
