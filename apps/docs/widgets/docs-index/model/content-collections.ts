import type { SearchData } from '../../../lib/get-search-data'

type Collection = {
    id: string
    kind: 'series' | 'path'
    title: { ko: string; en: string }
    description: { ko: string; en: string }
    hrefs: readonly string[]
}

// Editorial order, not publication date or inferred tag similarity.
export const CONTENT_COLLECTIONS: readonly Collection[] = [
    {
        id: 'browser-runtime',
        kind: 'series',
        title: { ko: '브라우저 런타임 노트', en: 'Browser runtime notes' },
        description: {
            ko: 'V8의 실행 역할부터 이벤트 루프까지, 런타임의 서로 다른 책임을 읽습니다.',
            en: 'Read about V8 execution and the different responsibilities of the event loop.',
        },
        hrefs: [
            '/docs/web/bytecode',
            '/docs/web/javascript-event-loop-runtime',
        ],
    },
    {
        id: 'react-boundaries',
        kind: 'series',
        title: {
            ko: 'React와 Next.js 경계 노트',
            en: 'React and Next.js boundaries',
        },
        description: {
            ko: '컴포넌트 책임을 나눈 뒤, 프레임워크 패키지를 살펴볼 기준을 정리합니다.',
            en: 'Start with component responsibilities, then explore framework packages.',
        },
        hrefs: [
            '/docs/category/fe/react/server-client-component-boundary',
            '/docs/category/fe/react/nextjs',
        ],
    },
    {
        id: 'overlay-focus',
        kind: 'path',
        title: {
            ko: '오버레이 포커스 점검 순서',
            en: 'Checking overlay focus',
        },
        description: {
            ko: '체크리스트로 기준을 잡고 Drawer 경고 조사 기록과 비교합니다. 두 번째 글은 조사 기록이며 확정된 해결 가이드가 아닙니다.',
            en: 'Start with the checklist, then compare a Drawer warning investigation. The second article is an investigation, not a confirmed fix.',
        },
        hrefs: [
            '/docs/ui-ux/focus-management-checklist',
            '/docs/ui-ux/blocked-aria-hidden',
        ],
    },
]

export function normalizeContentTag(value?: string) {
    return value?.normalize('NFKC').trim().toLowerCase().slice(0, 64) ?? ''
}

export function getContentTags(docs: readonly SearchData[]) {
    const counts = new Map<string, number>()
    for (const doc of docs) {
        const tags = new Set(doc.tags?.map(normalizeContentTag).filter(Boolean))
        for (const tag of tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
    return [...counts]
        .map(([tag, count]) => ({ tag, count }))
        .sort(
            (a, b) =>
                b.count - a.count || a.tag.localeCompare(b.tag, ['ko', 'en'])
        )
}

export function getContentCollections(docs: readonly SearchData[]) {
    const byHref = new Map(docs.map((doc) => [doc.href, doc]))
    return CONTENT_COLLECTIONS.map((collection) => ({
        ...collection,
        docs: collection.hrefs.flatMap((href) => {
            const doc = byHref.get(href)
            return doc ? [doc] : []
        }),
    })).filter((collection) => collection.docs.length >= 2)
}

export function isInContentCollection(doc: SearchData, id: string) {
    return (
        CONTENT_COLLECTIONS.find(
            (collection) => collection.id === id
        )?.hrefs.includes(doc.href) ?? false
    )
}
