import type { RemotePostContract } from '@web-tech/docs-content-contract'

// Synthetic public text only; no NAS documents or environment values are read.
export function createSearchPayloadFixture(count: number, bodyBytes: number) {
    const sentence = '브라우저 event loop 코드 흐름을 확인합니다. '
    const unit = Buffer.byteLength(sentence)
    const posts: RemotePostContract[] = []
    for (let index = 0; index < count; index++) {
        const suffix = index === count - 1 ? ' lastbodyneedle' : ' commonending'
        const available = bodyBytes - Buffer.byteLength(suffix)
        if (available < 0) throw new RangeError('bodyBytes is too small')
        const repeats = Math.floor(available / unit)
        posts.push({
            id: `web/probe-${index}`,
            markdownPath: `web/probe-${index}`,
            slug: `probe-${index}`,
            title: `Probe ${index}`,
            summary: 'Synthetic overview',
            date: '2026-10-26',
            updatedAt: '2026-10-26',
            status: 'published',
            authorName: 'Fixture',
            authorRole: 'Tester',
            readMinutes: 1,
            topicLabel: 'WEB',
            tags: ['runtime'],
            searchText:
                sentence.repeat(repeats) +
                'x'.repeat(available - repeats * unit) +
                suffix,
        })
    }
    return { results: posts }
}
