import assert from 'node:assert/strict'
import test from 'node:test'
import {
    DOCS_INDEX_SECTION_FILTERS,
    DOCS_INDEX_SORT_OPTIONS,
    resolveDocsIndexControls,
} from '../widgets/docs-index/model/docs-index-controls.ts'
import {
    DOCS_INDEX_SECTION_ORDER,
    DOCS_INDEX_SECTION_HREFS,
    getDocsIndexSectionMessageKey,
} from '../widgets/docs-index/model/docs-index-summary.ts'

test('section filters retain valid mappings and unique values', () => {
    assert.equal(
        new Set(DOCS_INDEX_SECTION_FILTERS.map((item) => item.value)).size,
        DOCS_INDEX_SECTION_FILTERS.length
    )
    for (const item of DOCS_INDEX_SECTION_FILTERS) {
        if (item.section !== null) {
            assert.equal(
                item.messageKey,
                getDocsIndexSectionMessageKey(item.section)
            )
        }
    }
    for (const section of DOCS_INDEX_SECTION_ORDER) {
        assert.ok(DOCS_INDEX_SECTION_HREFS[section].startsWith('/'))
    }
})

test('fixed sort values still resolve and invalid input falls back', () => {
    for (const sort of DOCS_INDEX_SORT_OPTIONS) {
        assert.equal(resolveDocsIndexControls({ sort }).sort, sort)
    }
    assert.deepEqual(
        resolveDocsIndexControls({ section: 'invalid', sort: 'invalid' }),
        { section: 'all', sort: 'latest' }
    )
})

test('configuration preserves literal types instead of widening to string', () => {
    const section: 'all' = DOCS_INDEX_SECTION_FILTERS[0].value
    const href: '/web' = DOCS_INDEX_SECTION_HREFS.Web
    assert.equal(section, 'all')
    assert.equal(href, '/web')
})
