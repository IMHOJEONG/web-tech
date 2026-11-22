import assert from 'node:assert/strict'
import test from 'node:test'
import { getDocsIndexCardLabels } from './docs-index-card-labels.ts'

test('card labels omit a topic repeated by the section and keep distinct tags', () => {
    assert.deepEqual(
        getDocsIndexCardLabels({
            section: 'Web',
            topicLabel: ' WEB ',
            tags: ['web', 'react', 'nextjs'],
        }),
        ['#react', '#nextjs']
    )
})

test('card labels keep a topic once and select two distinct tags after duplicates', () => {
    assert.deepEqual(
        getDocsIndexCardLabels({
            section: 'Web',
            topicLabel: 'React',
            tags: [
                'react',
                'React',
                'nextjs',
                'NEXTJS',
                'architecture',
                'extra',
            ],
        }),
        ['React', '#nextjs', '#architecture']
    )
})

test('card labels compare normalized identities but preserve visible spelling', () => {
    assert.deepEqual(
        getDocsIndexCardLabels({
            section: 'Web',
            topicLabel: ' React ',
            tags: ['Ｒｅａｃｔ', '# nextjs ', 'Café', 'Cafe\u0301'],
        }),
        ['React', '#nextjs', '#Café']
    )
})

test('card labels omit empty values and support missing metadata', () => {
    assert.deepEqual(getDocsIndexCardLabels({ section: 'Web' }), [])
    assert.deepEqual(
        getDocsIndexCardLabels({
            section: 'Web',
            topicLabel: ' ',
            tags: ['', ' ', '#'],
        }),
        []
    )
})

test('card labels do not conflate different technical labels', () => {
    assert.deepEqual(
        getDocsIndexCardLabels({
            section: 'Web',
            topicLabel: 'C',
            tags: ['C#', 'C++'],
        }),
        ['C', '#C#', '#C++']
    )
})

test('card labels leave readonly input untouched', () => {
    const input = Object.freeze({
        section: 'Web',
        topicLabel: 'React',
        tags: Object.freeze(['react', 'nextjs', 'architecture']),
    })
    assert.deepEqual(getDocsIndexCardLabels(input), [
        'React',
        '#nextjs',
        '#architecture',
    ])
    assert.deepEqual(input.tags, ['react', 'nextjs', 'architecture'])
})
