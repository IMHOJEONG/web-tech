import assert from 'node:assert/strict'
import test from 'node:test'
import { parseLocalDocument } from './local-document-parser.ts'
import { getDocHref } from './get-doc-route.ts'
import { syntheticDocumentSource } from '../../../scripts/prepare-ci-docs-content.mts'

test('ARIA duplicate is archived and canonical document remains public', () => {
    const parse = (file: string, content: string) =>
        parseLocalDocument(file, file.replace(/\.mdx$/, ''), content)
    assert.equal(
        parse(
            'category/fe/react/test.mdx',
            '---\nstatus: archived\nslug: test\ntitle: Synthetic archived duplicate\n---\n\nSynthetic archived input.'
        ),
        null
    )
    const canonical = parse(
        'data/shadcn/blocked-aria-hidden.mdx',
        syntheticDocumentSource('data/shadcn/blocked-aria-hidden.mdx')
    )
    assert.ok(canonical)
    assert.equal(getDocHref(canonical), '/docs/ui-ux/blocked-aria-hidden')
    assert.match(canonical.content ?? '', /Blocked aria-hidden/)
})
