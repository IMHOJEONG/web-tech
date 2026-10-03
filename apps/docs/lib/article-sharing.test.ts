import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
    buildArticleJsonLd,
    getArticleOgImageUrl,
    normalizeOgText,
    serializeJsonLd,
} from './article-sharing.ts'

const origin = new URL('https://heap-forge.app')

test('structured data uses the localized canonical URL and actual article fields', () => {
    for (const locale of ['ko', 'en'] as const) {
        const data = buildArticleJsonLd(
            {
                title: '이벤트 루프',
                summary: '실행 순서',
                markdownPath: 'web/event-loop',
                date: '2026-10-03',
                updatedAt: '2026-10-03T14:00:00+09:00',
                authorName: 'HoJeong Im',
                thumbnail: '/cover.webp',
            },
            locale,
            origin
        )
        assert.equal(data['@type'], 'BlogPosting')
        assert.equal(
            data.url,
            `https://heap-forge.app/${locale}/docs/web/event-loop`
        )
        assert.equal(data.mainEntityOfPage['@id'], data.url)
        assert.equal(data.headline, '이벤트 루프')
        assert.equal(data.dateModified, '2026-10-03T14:00:00+09:00')
        assert.deepEqual(data.image, ['https://heap-forge.app/cover.webp'])
        assert.deepEqual(data.author, { '@type': 'Person', name: 'HoJeong Im' })
    }
})

test('missing author and invalid dates are omitted rather than invented', () => {
    for (const date of [
        '',
        'yesterday',
        '2026-02-30',
        '2026-13-01',
        '2026-10-03T10:00:00',
    ]) {
        const data = JSON.parse(
            serializeJsonLd(
                buildArticleJsonLd(
                    { title: '문서', date, updatedAt: date },
                    'ko',
                    origin
                )
            )
        )
        assert.equal(data.author, undefined)
        assert.equal(data.datePublished, undefined)
        assert.equal(data.dateModified, undefined)
    }
})

test('JSON-LD cannot escape its script element with remote metadata', () => {
    const title = '</script><script>alert("x")</script>'
    const serialized = serializeJsonLd(
        buildArticleJsonLd({ title, summary: '<!--test-->' }, 'ko', origin)
    )
    assert.equal(serialized.includes('<'), false)
    assert.equal(JSON.parse(serialized).headline, title)
})

test('sharing URL safely encodes Korean and reserved characters, with bounded parameters', () => {
    const url = new URL(
        getArticleOgImageUrl(
            {
                title: '한글 & # ? 제목',
                topicLabel: 'WEB',
                authorName: 'HoJeong Im',
            },
            origin
        )
    )
    assert.equal(url.pathname, '/og/article.png')
    assert.equal(url.searchParams.get('title'), '한글 & # ? 제목')
    assert.equal(url.hash, '')
    assert.equal(Array.from(normalizeOgText('가'.repeat(200), 90)).length, 90)
    assert.equal(normalizeOgText('  한글\n 제목  ', 90), '한글 제목')
    assert.equal(normalizeOgText('', 90, 'HEAP-FORGE'), 'HEAP-FORGE')
})
