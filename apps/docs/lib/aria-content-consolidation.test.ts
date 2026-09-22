import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { parseLocalDocument } from './local-document-parser.ts'
import { getDocHref } from './get-doc-route.ts'

test('ARIA duplicate is archived and canonical document remains public', async () => {
    const parse = async (file: string) =>
        parseLocalDocument(
            file,
            file.replace(/\.mdx$/, ''),
            await readFile(new URL(`../${file}`, import.meta.url), 'utf8')
        )
    assert.equal(await parse('category/fe/react/test.mdx'), null)
    const canonical = await parse('data/shadcn/blocked-aria-hidden.mdx')
    assert.ok(canonical)
    assert.equal(getDocHref(canonical), '/docs/ui-ux/blocked-aria-hidden')
    assert.match(canonical.content ?? '', /Blocked aria-hidden/)
})
