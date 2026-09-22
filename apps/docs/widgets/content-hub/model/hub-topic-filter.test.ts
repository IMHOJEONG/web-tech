import assert from 'node:assert/strict'
import test from 'node:test'
import {
    getHubTopicHref,
    resolveHubTopics,
    splitHubTopics,
} from './hub-topic-filter.ts'

const docs = [
    {
        id: 'local',
        tags: ['React', ' react ', 'Ｒｅａｃｔ', 'nextjs'],
        topicLabel: 'WEB',
    },
    { id: 'remote', tags: ['react', 'typescript'] },
    { id: 'fallback', tags: ['  '], topicLabel: 'Browser' },
    { id: 'untagged' },
]

test('counts each document once per normalized topic, preferring tags', () => {
    const result = resolveHubTopics(docs)
    assert.deepEqual(result.topics[0], {
        value: 'react',
        label: 'React',
        count: 2,
    })
    assert.equal(
        result.topics.find((topic) => topic.value === 'web'),
        undefined
    )
    assert.equal(
        result.topics.find((topic) => topic.value === 'browser')?.count,
        1
    )
    assert.equal(result.docs.length, 4)
})

test('filters local and remote metadata equally and preserves input order', () => {
    assert.deepEqual(
        resolveHubTopics(docs, ' REACT ').docs.map((doc) => doc.id),
        ['local', 'remote']
    )
    assert.deepEqual(
        resolveHubTopics(docs, 'browser').docs.map((doc) => doc.id),
        ['fallback']
    )
    assert.equal(docs.length, 4)
})

test('unknown, empty and repeated query parameters show all docs', () => {
    for (const query of [undefined, '', 'missing', ['react', 'nextjs']]) {
        const result = resolveHubTopics(docs, query)
        assert.equal(result.selected, undefined)
        assert.equal(result.docs.length, 4)
    }
})

test('hides unnecessary filters for empty, single-document or single-topic collections', () => {
    assert.equal(resolveHubTopics([]).showFilters, false)
    assert.equal(resolveHubTopics([docs[0]!]).showFilters, false)
    assert.equal(
        resolveHubTopics([{ tags: ['react'] }, { tags: ['react'] }])
            .showFilters,
        false
    )
    assert.equal(resolveHubTopics(docs).showFilters, true)
})

test('keeps selected topics visible and remaining topics accessible without duplication', () => {
    const { topics } = resolveHubTopics(
        Array.from({ length: 10 }, (_, index) => ({ tags: [`topic-${index}`] }))
    )
    const { visible, remaining } = splitHubTopics(topics, 'topic-9')
    assert.equal(visible.length, 6)
    assert.ok(visible.some((topic) => topic.value === 'topic-9'))
    assert.equal(
        new Set([...visible, ...remaining].map((topic) => topic.value)).size,
        10
    )
    assert.deepEqual(splitHubTopics([]), { visible: [], remaining: [] })
})

test('encodes topic queries and resets to the same channel path', () => {
    assert.equal(getHubTopicHref('/web'), '/web')
    const href = getHubTopicHref('/mobile', 'ios & android/기초')
    assert.equal(
        new URL(href, 'https://example.test').searchParams.get('topic'),
        'ios & android/기초'
    )
    assert.equal(
        resolveHubTopics([{ tags: ['__proto__'] }]).topics[0]?.label,
        '__proto__'
    )
})

test('does not truncate matching articles at the previous six-document limit', () => {
    const many = Array.from({ length: 9 }, (_, id) => ({ id, tags: ['react'] }))
    assert.equal(resolveHubTopics(many, 'react').docs.length, 9)
})
