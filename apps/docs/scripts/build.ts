import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { preparePrivateContent } from './prepare-private-content.ts'
import { main as validateMetadata } from './validate-content.mjs'
import { main as validateStyle } from './validate-content-style.mjs'

const appRoot = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(import.meta.url)
// Use the same .env loading implementation as the installed Next.js version.
const nextRequire = createRequire(require.resolve('next/package.json'))
nextRequire('@next/env').loadEnvConfig(appRoot, false)

try {
    const revision = await preparePrivateContent(appRoot, process.env)
    delete process.env.DOCS_PRIVATE_CONTENT_SSH_KEY
    delete process.env.DOCS_PRIVATE_CONTENT_REVISION
    if (revision) process.env.DOCS_PRIVATE_CONTENT_REVISION = revision
    await validateMetadata()
    await validateStyle()
    const result = spawnSync(
        process.execPath,
        [
            require.resolve('next/dist/bin/next'),
            'build',
            ...process.argv.slice(2),
        ],
        { cwd: appRoot, stdio: 'inherit' }
    )
    if (result.error) throw result.error
    process.exitCode = result.status ?? 1
} catch {
    // Raw Git/MDX exceptions may contain private text or credential-bearing URLs.
    console.error(
        '[docs] Build input preparation or validation failed. No release was deployed.'
    )
    process.exitCode = 1
}
