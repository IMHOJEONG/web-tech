import assert from 'node:assert/strict'
import test from 'node:test'
import { getDocumentCalendarDate } from '../shared/lib/document-date.ts'
import { filterTocItems } from '../widgets/article-toc/model/toc-items.ts'
import type { TocItem } from 'remark-flexible-toc'

test('document dates reject normalized impossible days and retain calendar dates', () => {
    assert.equal(getDocumentCalendarDate('2026-02-30'), undefined)
    assert.equal(getDocumentCalendarDate('2026-13-01'), undefined)
    assert.equal(getDocumentCalendarDate('2026-02-29'), undefined)
    assert.equal(getDocumentCalendarDate('2024-02-29'), '2024-02-29')
    assert.equal(
        getDocumentCalendarDate('2026-10-31T23:00:00-05:00'),
        '2026-10-31'
    )
    assert.equal(getDocumentCalendarDate('October 31, 2026'), '2026-10-31')
    assert.equal(getDocumentCalendarDate('2026-10'), '2026-10-01')
    assert.equal(getDocumentCalendarDate('2026'), '2026-01-01')
    assert.equal(getDocumentCalendarDate('not a date'), undefined)
    assert.equal(getDocumentCalendarDate(), undefined)
})

test('server TOC visibility uses the same filtering as the client list', () => {
    const title = {
        depth: 1,
        parent: 'root',
        value: 'Title',
        href: '#title',
        numbering: [1],
    } as TocItem
    const heading = {
        depth: 2,
        parent: 'root',
        value: 'Section',
        href: '#section',
        numbering: [1, 1],
    } as TocItem
    assert.deepEqual(filterTocItems([title]), [])
    assert.deepEqual(filterTocItems([title, heading]), [heading])
    assert.deepEqual(filterTocItems([heading], { exclude: 'Section' }), [])
    assert.deepEqual(filterTocItems([heading], { maxDepth: 1 }), [])
})
