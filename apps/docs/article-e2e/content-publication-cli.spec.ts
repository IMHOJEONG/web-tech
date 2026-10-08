import { expect, test } from '@playwright/test'
import { execFile } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

const exec = promisify(execFile)
const revalidationToken = 'article-e2e-only-revalidation'

test('publication CLI rejects stale Next.js pages and verifies the authorized refresh', async ({
    request,
}) => {
    test.setTimeout(60_000)
    const directory = await mkdtemp(join(tmpdir(), 'publication-cli-e2e-'))
    const tokenFile = join(directory, 'token')
    const expectationFile = join(directory, 'expectation.json')
    const documentPath = '/ko/docs/web/article-e2e-publication'
    await writeFile(tokenFile, revalidationToken, { mode: 0o600 })
    await writeFile(
        expectationFile,
        JSON.stringify({
            documentPath,
            listPath: '/ko/docs',
            title: 'Publication cache probe V2',
            summaryMarker: 'PUBLICATION_SUMMARY_V2',
            searchQuery: 'Publication cache probe',
            bodyMarkers: ['PUBLICATION_BODY_V2', 'PUBLICATION_END_V2'],
            timeoutMs: 20_000,
            requestTimeoutMs: 5_000,
            pollIntervalMs: 100,
            maxAttempts: 3,
        })
    )
    const env: NodeJS.ProcessEnv = {
        ...process.env,
        DOCS_CONTENT_REVALIDATE_URL:
            'http://127.0.0.1:3111/api/revalidate/content',
        DOCS_CONTENT_REVALIDATE_TOKEN_FILE: tokenFile,
        DOCS_CONTENT_VERIFY_FILE: expectationFile,
    }
    // Playwright sets FORCE_COLOR while the runner can also set NO_COLOR.
    delete env.FORCE_COLOR
    async function setOrigin(version: 1 | 2) {
        const response = await request.post(
            `http://127.0.0.1:3112/__test/publication/${version}`,
            { headers: { Authorization: 'Bearer article-e2e-only-control' } }
        )
        expect(response.status()).toBe(204)
    }
    async function invalidate() {
        const response = await request.post('/api/revalidate/content', {
            headers: { Authorization: `Bearer ${revalidationToken}` },
        })
        expect(response.status()).toBe(200)
    }
    try {
        await setOrigin(1)
        await invalidate()
        for (const path of [
            '/ko/docs',
            '/api/search?q=Publication%20cache%20probe',
            documentPath,
        ]) {
            const response = await request.get(path)
            expect(response.status()).toBe(200)
            expect(await response.text()).toContain(
                path.startsWith('/api/')
                    ? 'Publication cache probe V1'
                    : path === documentPath
                      ? 'PUBLICATION_BODY_V1'
                      : 'PUBLICATION_SUMMARY_V1'
            )
        }
        await setOrigin(2)
        await expect(
            exec(
                process.execPath,
                ['scripts/revalidate-content-cache.mjs', '--verify-only'],
                { env, timeout: 30_000 }
            )
        ).rejects.toMatchObject({
            code: 1,
            stderr: expect.stringContaining('Publication not verified'),
        })
        const result = await exec(
            process.execPath,
            ['scripts/revalidate-content-cache.mjs'],
            { env, timeout: 30_000 }
        )
        expect(result.stderr).toBe('')
        expect(result.stdout).toContain('list=fresh search=fresh article=fresh')
        expect(result.stdout).toContain('Publication verified')
        expect(result.stdout).not.toContain(revalidationToken)
        expect(result.stdout).not.toContain('PUBLICATION_BODY_V2')
    } finally {
        try {
            await setOrigin(1)
            await invalidate()
        } finally {
            await rm(directory, { recursive: true, force: true })
        }
    }
})
