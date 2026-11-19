import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test, { type TestContext } from 'node:test'
import { readReviews } from '../../../scripts/check-publication.mts'
import {
    getPrivateContentRoot,
    resolveLocalContentRoot,
} from '../lib/local-content-paths.ts'
import { getLocalSearchRevision } from '../lib/local-search-revision.ts'
import {
    parseContentRelease,
    preparePrivateContent,
    stagePrivateContent,
    type GitReader,
} from './prepare-private-content.ts'

const revision = 'a'.repeat(40)
const release = {
    version: 1,
    repository: 'https://github.com/example/content.git',
    revision,
    routes: ['/docs/web/demo'],
}
const published = (body = '## Details\n\nPublic example.') => `---
status: published
slug: demo
title: Example
summary: Example summary
date: 2026-01-01
updatedAt: 2026-01-01
authorName: Example
authorRole: Engineer
readMinutes: 2
topicLabel: Web
---

${body}
`
const digest = (value: string) =>
    createHash('sha256').update(value).digest('hex')
function reviewed(files: Record<string, string>) {
    // Explicit synthetic approvals never authorize any real repository content.
    return readReviews(
        Buffer.from(
            JSON.stringify({
                version: 1,
                entries: Object.entries(files).map(([name, bytes]) => ({
                    path: `apps/docs/${name}`,
                    sha256: digest(bytes),
                    kind: name.startsWith('public/') ? 'asset' : 'article',
                    decision: 'public-approved',
                    reviewedOn: '2026-11-17',
                    note: 'Synthetic fixture for the publication regression only.',
                    checks: {
                        secrets: true,
                        personalData: true,
                        rights: true,
                        publicIntent: true,
                    },
                })),
            })
        )
    )
}
function reader(
    files: Record<string, string>,
    modes: Record<string, string> = {}
): GitReader {
    return ([operation, spec]) => {
        if (operation === 'ls-tree')
            return Buffer.from(
                Object.keys(files)
                    .map(
                        (name) =>
                            `${modes[name] ?? '100644'} blob fixture\t${name}\0`
                    )
                    .join('')
            )
        assert.equal(operation, 'show')
        assert.ok(spec?.startsWith(`${revision}:`))
        const value = files[spec!.slice(revision.length + 1)]
        assert.notEqual(value, undefined)
        return Buffer.from(value!)
    }
}
function root(t: TestContext) {
    const directory = fs.mkdtempSync(
        path.join(os.tmpdir(), 'content-release-test-')
    )
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
    return directory
}

test('release locks reject mutable refs, credentials, duplicate URLs and extra keys', () => {
    assert.deepEqual(parseContentRelease(release), release)
    const credentialed = new URL('https://github.com/org/content.git')
    credentialed.username = 'user'
    credentialed.password = 'pass'
    for (const value of [
        null,
        {},
        { ...release, revision: 'main' },
        { ...release, repository: 'https://example.test/content.git' },
        {
            ...release,
            repository: credentialed.href,
        },
        { ...release, routes: [] },
        { ...release, routes: ['/docs/../secret'] },
        { ...release, routes: ['/docs/web/demo', '/docs/web/demo'] },
        { ...release, extra: true },
    ]) {
        assert.throws(
            () => parseContentRelease(value),
            /Invalid content release/
        )
    }
})

test('only reviewed published sources and referenced assets reach the release', async (t) => {
    const directory = root(t)
    const files = {
        'data/v8/demo.mdx': published(
            '![Diagram][figure]\n\n[figure]: /images/figure.png'
        ),
        'data/v8/draft.mdx': '---\nstatus: draft\n---\nprivate draft fixture',
        'data/v8/archived.mdx': '---\nstatus: archived\n---\nold fixture',
        'public/images/figure.png': 'synthetic image',
        'public/unused.png': 'unreferenced fixture',
        'private/raw.txt': 'private fixture',
    }
    assert.deepEqual(
        await stagePrivateContent(
            directory,
            release,
            reader(files),
            reviewed(files)
        ),
        { documentCount: 1, assetCount: 1 }
    )
    const staged = resolveLocalContentRoot(directory, revision)
    assert.equal(staged, getPrivateContentRoot(directory, revision))
    assert.deepEqual(fs.readdirSync(path.join(staged, 'data/v8')), ['demo.mdx'])
    assert.deepEqual(fs.readdirSync(path.join(directory, 'public')), ['images'])
    assert.equal(fs.existsSync(path.join(directory, '.git')), false)
    assert.equal(fs.existsSync(path.join(directory, 'private')), false)
    assert.notEqual(
        getLocalSearchRevision(staged, revision),
        getLocalSearchRevision(staged, 'b'.repeat(40))
    )
    assert.throws(
        () => resolveLocalContentRoot(directory, 'b'.repeat(40)),
        /missing/
    )
})

test('missing review, stale hash and private visibility fail before any writes', async (t) => {
    const directory = root(t)
    const name = 'data/v8/demo.mdx'
    const original = { [name]: published() }
    const privateDoc = {
        [name]: published().replace(
            'status: published',
            'status: published\nvisibility: private'
        ),
    }
    for (const [files, approvals] of [
        [original, []],
        [{ [name]: published('Changed after review') }, reviewed(original)],
        [privateDoc, reviewed(privateDoc)],
    ] as const) {
        await assert.rejects(
            stagePrivateContent(directory, release, reader(files), [
                ...approvals,
            ]),
            /publication denied/
        )
        assert.deepEqual(fs.readdirSync(directory), [])
    }
})

test('routes, authoring rules and symlinks cannot bypass the release boundary', async (t) => {
    const directory = root(t)
    for (const [files, modes, expected] of [
        [
            { 'data/v8/demo.mdx': published() },
            { 'data/v8/demo.mdx': '120000' },
            /regular content file/,
        ],
        [
            { 'data/v8/demo.mdx': published(), 'data/v8/demo.md': published() },
            {},
            /Duplicate published route/,
        ],
        [{ 'data/v8/other.mdx': published() }, {}, /routes differ/],
        [
            {
                'data/v8/demo.mdx': published().replace(
                    'authorName: Example\n',
                    ''
                ),
            },
            {},
            /authoring validation/,
        ],
        [
            { 'data/v8/demo.mdx': published('![Unsafe](../../secret.png)') },
            {},
            /absolute public path/,
        ],
        [
            { 'data/v8/demo.mdx': published('<Image src={value} />') },
            {},
            /syntax or media references/,
        ],
        [
            {
                'data/v8/demo.mdx': published(
                    '![Missing](/images/missing.png)'
                ),
            },
            {},
            /regular content file/,
        ],
        [
            { 'data/v8/demo.mdx': published(), 'data/script.ts': 'code' },
            {},
            /Only Markdown/,
        ],
    ] as [Record<string, string>, Record<string, string>, RegExp][]) {
        await assert.rejects(
            stagePrivateContent(
                directory,
                release,
                reader(files, modes),
                reviewed(files)
            ),
            expected
        )
        assert.deepEqual(fs.readdirSync(directory), [])
    }
})

test('oversized files and credential patterns are not exempted by approval', async (t) => {
    const directory = root(t)
    const name = 'data/v8/demo.mdx'
    const oversized = { [name]: published('x'.repeat(8 * 1024 * 1024)) }
    await assert.rejects(
        stagePrivateContent(
            directory,
            release,
            reader(oversized),
            reviewed(oversized)
        ),
        /byte budget/
    )
    const files = {
        [name]: published(`Authorization: Bearer ${'x'.repeat(32)}`),
    }
    await assert.rejects(
        stagePrivateContent(directory, release, reader(files), reviewed(files)),
        /credential-pattern/
    )
    assert.deepEqual(fs.readdirSync(directory), [])
})

test('aggregate byte budget prevents an oversized release even with small individual files', async (t) => {
    const directory = root(t)
    const files: Record<string, string> = {
        'data/v8/demo.mdx': published(
            Array.from(
                { length: 5 },
                (_, index) => `![Figure](/images/figure-${index}.png)`
            ).join('\n\n')
        ),
    }
    for (let index = 0; index < 5; index++) {
        files[`public/images/figure-${index}.png`] = 'x'.repeat(7 * 1024 * 1024)
    }
    await assert.rejects(
        stagePrivateContent(directory, release, reader(files), reviewed(files)),
        /byte budget/
    )
    assert.deepEqual(fs.readdirSync(directory), [])
})

test('an existing application asset cannot be overwritten by the content repository', async (t) => {
    const directory = root(t)
    fs.mkdirSync(path.join(directory, 'public/images'), { recursive: true })
    fs.writeFileSync(
        path.join(directory, 'public/images/figure.png'),
        'application bytes'
    )
    const files = {
        'data/v8/demo.mdx': published('![Figure](/images/figure.png)'),
        'public/images/figure.png': 'content bytes',
    }
    await assert.rejects(
        stagePrivateContent(directory, release, reader(files), reviewed(files)),
        /conflicts with an application file/
    )
    assert.equal(
        fs.readFileSync(
            path.join(directory, 'public/images/figure.png'),
            'utf8'
        ),
        'application bytes'
    )
    assert.equal(
        fs.existsSync(path.join(directory, '.generated-content')),
        false
    )
})

test('owned generated assets remain immutable and approved changes need a versioned path', async (t) => {
    const directory = root(t)
    const first = {
        'data/v8/demo.mdx': published('![Figure](/images/figure-v1.png)'),
        'public/images/figure-v1.png': 'synthetic first image',
    }
    await stagePrivateContent(
        directory,
        release,
        reader(first),
        reviewed(first)
    )
    const ownership = fs.readFileSync(
        path.join(directory, '.generated-content/assets.json'),
        'utf8'
    )
    const replacement = {
        ...first,
        'public/images/figure-v1.png': 'synthetic changed image',
    }
    await assert.rejects(
        stagePrivateContent(
            directory,
            release,
            reader(replacement),
            reviewed(replacement)
        ),
        /conflicts/
    )
    assert.equal(
        fs.readFileSync(
            path.join(directory, 'public/images/figure-v1.png'),
            'utf8'
        ),
        first['public/images/figure-v1.png']
    )
    assert.equal(
        fs.readFileSync(
            path.join(directory, '.generated-content/assets.json'),
            'utf8'
        ),
        ownership
    )
    const second = {
        'data/v8/demo.mdx': published('![Figure](/images/figure-v2.png)'),
        'public/images/figure-v2.png': 'synthetic changed image',
    }
    await stagePrivateContent(
        directory,
        release,
        reader(second),
        reviewed(second)
    )
    assert.equal(
        fs.existsSync(path.join(directory, 'public/images/figure-v1.png')),
        false
    )
    assert.equal(
        fs.readFileSync(
            path.join(directory, 'public/images/figure-v2.png'),
            'utf8'
        ),
        second['public/images/figure-v2.png']
    )
})

test('failed ownership writes remove only newly created assets and retries retain ownership', async (t) => {
    const directory = root(t)
    fs.mkdirSync(path.join(directory, 'public/images'), { recursive: true })
    fs.writeFileSync(
        path.join(directory, 'public/images/application.png'),
        'application image'
    )
    const files = {
        'data/v8/demo.mdx': published(
            '![A](/images/application.png)\n![B](/images/generated.png)'
        ),
        'public/images/application.png': 'application image',
        'public/images/generated.png': 'generated image',
    }
    const write = fs.writeFileSync
    const failure = t.mock.method(
        fs,
        'writeFileSync',
        (...args: Parameters<typeof write>) => {
            if (
                args[0] ===
                path.join(directory, '.generated-content/assets.json')
            ) {
                throw new Error('synthetic ledger failure')
            }
            return write(...args)
        }
    )
    await assert.rejects(
        stagePrivateContent(directory, release, reader(files), reviewed(files)),
        /synthetic ledger failure/
    )
    failure.mock.restore()
    assert.equal(
        fs.existsSync(path.join(directory, 'public/images/generated.png')),
        false
    )
    assert.equal(
        fs.readFileSync(
            path.join(directory, 'public/images/application.png'),
            'utf8'
        ),
        'application image'
    )
    await stagePrivateContent(
        directory,
        release,
        reader(files),
        reviewed(files)
    )
    const next = { 'data/v8/demo.mdx': published() }
    await stagePrivateContent(directory, release, reader(next), reviewed(next))
    assert.equal(
        fs.existsSync(path.join(directory, 'public/images/generated.png')),
        false
    )
    assert.equal(
        fs.readFileSync(
            path.join(directory, 'public/images/application.png'),
            'utf8'
        ),
        'application image'
    )
})

test('a partial asset write closes its descriptor and removes only the new file before retry', async (t) => {
    const directory = root(t)
    fs.mkdirSync(path.join(directory, 'public/images'), { recursive: true })
    const application = path.join(directory, 'public/images/application.png')
    fs.writeFileSync(application, 'application image')
    const files = {
        'data/v8/demo.mdx': published('![Figure](/images/generated.png)'),
        'public/images/generated.png': 'generated image',
    }
    let descriptor: number | undefined
    const write = fs.writeFileSync
    const failure = t.mock.method(
        fs,
        'writeFileSync',
        (...args: Parameters<typeof write>) => {
            if (typeof args[0] === 'number') {
                descriptor = args[0]
                write(descriptor, 'partial')
                throw new Error('synthetic partial asset failure')
            }
            return write(...args)
        }
    )
    await assert.rejects(
        stagePrivateContent(directory, release, reader(files), reviewed(files)),
        /synthetic partial asset failure/
    )
    failure.mock.restore()
    assert.equal(typeof descriptor, 'number')
    assert.throws(() => fs.fstatSync(descriptor!), { code: 'EBADF' })
    assert.equal(
        fs.existsSync(path.join(directory, 'public/images/generated.png')),
        false
    )
    assert.equal(fs.readFileSync(application, 'utf8'), 'application image')
    await stagePrivateContent(
        directory,
        release,
        reader(files),
        reviewed(files)
    )
    assert.equal(
        fs.readFileSync(
            path.join(directory, 'public/images/generated.png'),
            'utf8'
        ),
        'generated image'
    )
    assert.deepEqual(
        JSON.parse(
            fs.readFileSync(
                path.join(directory, '.generated-content/assets.json'),
                'utf8'
            )
        ),
        [
            {
                path: 'public/images/generated.png',
                sha256: digest('generated image'),
            },
        ]
    )
})

test('referenced but unreviewed assets and target symlinks are rejected', async (t) => {
    const directory = root(t)
    const files = {
        'data/v8/demo.mdx': published('![Diagram](/images/figure.png)'),
        'public/images/figure.png': 'image',
    }
    await assert.rejects(
        stagePrivateContent(
            directory,
            release,
            reader(files),
            reviewed({ 'data/v8/demo.mdx': files['data/v8/demo.mdx'] })
        ),
        /public-review-required/
    )
    fs.mkdirSync(path.join(directory, 'public'))
    fs.symlinkSync(root(t), path.join(directory, 'public/images'))
    await assert.rejects(
        stagePrivateContent(directory, release, reader(files), reviewed(files)),
        /symbolic links/
    )
})

test('a later release removes only assets generated by the earlier release', async (t) => {
    const directory = root(t)
    fs.mkdirSync(path.join(directory, 'public'))
    fs.writeFileSync(
        path.join(directory, 'public/application.txt'),
        'application asset'
    )
    const first = {
        'data/v8/demo.mdx': published('![Diagram](/images/figure.png)'),
        'public/images/figure.png': 'synthetic image',
    }
    await stagePrivateContent(
        directory,
        release,
        reader(first),
        reviewed(first)
    )
    const second = { 'data/v8/demo.mdx': published() }
    await stagePrivateContent(
        directory,
        release,
        reader(second),
        reviewed(second)
    )
    assert.equal(
        fs.existsSync(path.join(directory, 'public/images/figure.png')),
        false
    )
    assert.equal(
        fs.readFileSync(path.join(directory, 'public/application.txt'), 'utf8'),
        'application asset'
    )
})

test('legacy builds do not fetch private Git; private mode without a key fails closed', async (t) => {
    const directory = root(t)
    fs.writeFileSync(
        path.join(directory, 'content-release.lock.json'),
        JSON.stringify(release)
    )
    assert.equal(await preparePrivateContent(directory, {}), undefined)
    await assert.rejects(
        preparePrivateContent(directory, {
            DOCS_CONTENT_SOURCE: 'private-git',
        }),
        /read-only deploy key/
    )
})

test('a configured mismatched revision fails before credentials, Git or generated writes', async (t) => {
    const directory = root(t)
    fs.writeFileSync(
        path.join(directory, 'content-release.lock.json'),
        JSON.stringify(release)
    )
    let calls = 0
    for (const requested of ['b'.repeat(40), '', 'main']) {
        await assert.rejects(
            preparePrivateContent(
                directory,
                {
                    DOCS_CONTENT_SOURCE: 'private-git',
                    DOCS_PRIVATE_CONTENT_REVISION: requested,
                },
                () => {
                    calls++
                    throw new Error('must not run Git')
                }
            ),
            /Configured content revision does not match the lock/
        )
    }
    assert.equal(calls, 0)
    assert.equal(
        fs.existsSync(path.join(directory, '.generated-content')),
        false
    )
})

test('fetch uses a pinned SHA, isolated credentials and cleans up temporary keys', async (t) => {
    const directory = root(t)
    fs.writeFileSync(
        path.join(directory, 'content-release.lock.json'),
        JSON.stringify(release)
    )
    const files = { 'data/v8/demo.mdx': published() }
    const reviewBytes = JSON.stringify({
        version: 1,
        entries: reviewed(files).map((entry) => ({
            ...entry,
            decision: 'public-approved',
            checks: {
                secrets: true,
                personalData: true,
                rights: true,
                publicIntent: true,
            },
        })),
    })
    let checkout = ''
    let fetched = 0
    const git: Parameters<typeof preparePrivateContent>[2] = (
        args,
        options
    ) => {
        checkout = options.cwd
        assert.equal(fs.statSync(checkout).mode & 0o777, 0o700)
        assert.equal(
            fs.statSync(path.join(checkout, 'identity')).mode & 0o777,
            0o600
        )
        assert.equal(options.env.DOCS_PRIVATE_CONTENT_SSH_KEY, undefined)
        assert.equal(options.env.BLOG_CONTENT_API_TOKEN, undefined)
        assert.equal(options.env.GIT_TERMINAL_PROMPT, '0')
        assert.equal(options.timeout, 45000)
        if (args[0] === 'init') return Buffer.from('')
        if (args[0] === 'fetch') {
            fetched++
            assert.equal(args.at(-1), revision)
            assert.equal(
                args.at(-2),
                'ssh://git@ssh.github.com:443/example/content.git'
            )
            return Buffer.from('')
        }
        if (args[0] === 'rev-parse') return Buffer.from(revision)
        if (args[0] === 'ls-tree' && args[1] === '--name-only')
            return Buffer.from('.publication-review.json\n')
        if (args[1] === `${revision}:.publication-review.json`)
            return Buffer.from(reviewBytes)
        return reader(files)(args)
    }
    t.mock.method(console, 'info', () => {})
    const env = {
        DOCS_CONTENT_SOURCE: 'private-git',
        DOCS_PRIVATE_CONTENT_SSH_KEY: 'synthetic key fixture',
        BLOG_CONTENT_API_TOKEN: 'synthetic fixture',
        PATH: '/usr/bin:/bin',
    }
    assert.equal(await preparePrivateContent(directory, env, git), revision)
    assert.equal(fetched, 1)
    assert.equal(fs.existsSync(checkout), false)
    assert.equal(
        await preparePrivateContent(
            directory,
            { ...env, DOCS_PRIVATE_CONTENT_REVISION: revision },
            git
        ),
        revision
    )
    assert.equal(fetched, 2)
    assert.equal(fs.existsSync(checkout), false)
    await assert.rejects(
        preparePrivateContent(directory, env, (args, options) => {
            checkout = options.cwd
            if (args[0] === 'fetch')
                throw new Error('synthetic private error that must not escape')
            return Buffer.from('')
        }),
        /^Error: Could not fetch the pinned private content revision$/
    )
    assert.equal(fs.existsSync(checkout), false)
    await assert.rejects(
        preparePrivateContent(directory, env, (args, options) => {
            if (args[0] === 'rev-parse') return Buffer.from('b'.repeat(40))
            return git(args, options)
        }),
        /does not match/
    )
    assert.equal(fs.existsSync(checkout), false)
})
