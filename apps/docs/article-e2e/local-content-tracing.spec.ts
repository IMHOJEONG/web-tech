import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { listLocalMarkdownFiles } from '../lib/local-markdown-files'

test('production traces retain local Markdown without the removed glob packages', () => {
    const sources = listLocalMarkdownFiles(process.cwd())
    expect(sources.length).toBeGreaterThan(0)
    for (const trace of [
        '.next/server/app/api/search/route.js.nft.json',
        '.next/server/app/[locale]/docs/[...slugParts]/page.js.nft.json',
        '.next/server/app/[locale]/category/[main]/[sub]/page.js.nft.json',
    ]) {
        const payload = JSON.parse(readFileSync(trace, 'utf8')) as {
            files: string[]
        }
        const files = payload.files.map((file) =>
            path.resolve(path.dirname(trace), file)
        )
        expect(sources.every((source) => files.includes(source))).toBe(true)
        expect(
            files.filter((file) =>
                /\/(?:braces|fast-glob|micromatch)(?:@|\/)/.test(file)
            )
        ).toEqual([])
    }
})
