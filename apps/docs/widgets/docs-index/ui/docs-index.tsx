import { getTime } from '@web-tech/ui/lib/time'
import Link from 'next/link'
import type { SearchData } from '~/lib/get-search-data'

type DocsIndexProps = {
    docs: SearchData[]
    recommendations: string[]
    keyword?: string
}

type SectionOverview = {
    key: string
    label: string
    description: string
    href: string
}

const SECTION_ORDER = [
    'Web',
    'UI/UX',
    'Backend',
    'Computer Science',
    'Docs',
] as const

type SectionKey = (typeof SECTION_ORDER)[number]

const SECTION_OVERVIEW: Record<SectionKey, SectionOverview> = {
    Web: {
        key: 'Web',
        label: 'Web',
        description: '브라우저, 프론트엔드, 렌더링 관련 문서',
        href: '/web',
    },
    'UI/UX': {
        key: 'UI/UX',
        label: 'UI/UX',
        description: '인터페이스와 경험 설계 관련 문서',
        href: '/ui-ux',
    },
    Backend: {
        key: 'Backend',
        label: 'Backend',
        description: '서버 구조와 API 관점의 기술 노트',
        href: '/category/be',
    },
    'Computer Science': {
        key: 'Computer Science',
        label: 'Computer Science',
        description: '운영체제, 컴퓨터 과학 기반 문서',
        href: '/category/computer-science',
    },
    Docs: {
        key: 'Docs',
        label: 'General Docs',
        description: '기타 문서와 기록성 아티클',
        href: '/docs',
    },
}

function getSectionSummary(docs: SearchData[]) {
    const counts = new Map<string, number>()
    const latestDates = new Map<string, string>()

    docs.forEach((doc) => {
        const currentCount = counts.get(doc.section) ?? 0
        counts.set(doc.section, currentCount + 1)

        if (!latestDates.has(doc.section) && doc.date) {
            latestDates.set(doc.section, doc.date)
        }
    })

    return SECTION_ORDER.filter((section) => counts.has(section)).map(
        (section) => ({
            ...SECTION_OVERVIEW[section],
            count: counts.get(section) ?? 0,
            latest: latestDates.get(section),
        })
    )
}

function DocsIndexCard({ doc }: { doc: SearchData }) {
    return (
        <Link
            href={doc.href}
            className="group rounded-3xl border border-zinc-200/80 bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,24,27,0.05)] transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_20px_48px_rgba(24,24,27,0.08)] dark:border-zinc-800 dark:bg-zinc-950/90 dark:hover:border-zinc-700"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                            {doc.section}
                        </span>
                        {doc.date && (
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                {getTime(doc.date)}
                            </span>
                        )}
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold tracking-[-0.02em] text-zinc-900 transition-colors group-hover:text-zinc-700 dark:text-zinc-100 dark:group-hover:text-zinc-200">
                            {doc.title ?? doc.slug}
                        </h3>
                        {doc.summary && (
                            <p className="line-clamp-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                                {doc.summary}
                            </p>
                        )}
                    </div>
                </div>
                <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 transition-colors group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
                    Open
                </span>
            </div>
        </Link>
    )
}

export function DocsIndex({ docs, recommendations, keyword }: DocsIndexProps) {
    const sectionSummary = getSectionSummary(docs)
    const latestUpdated = docs[0]?.date ? getTime(docs[0].date) : null

    if (keyword) {
        return (
            <main className="docs-shell px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
                <div className="space-y-8">
                    <section className="rounded-[28px] border border-zinc-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,244,245,0.92))] p-6 shadow-[0_20px_60px_rgba(24,24,27,0.06)] dark:border-zinc-800 dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.92))] sm:p-8">
                        <div className="space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                                Search Results
                            </p>
                            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
                                &quot;{keyword}&quot;에 대한 검색 결과
                            </h1>
                            <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400 sm:text-base">
                                `/docs`는 큐레이션 피드가 아니라 문서 인덱스
                                컨텍스트입니다. 제목, 요약, 분류, 본문을
                                바탕으로 관련 문서를 정리했습니다.
                            </p>
                            <div className="flex flex-wrap gap-2 pt-2">
                                <span className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                                    {docs.length} results
                                </span>
                                {recommendations.map((term) => (
                                    <Link
                                        key={term}
                                        href={`/docs?q=${encodeURIComponent(term)}`}
                                        className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                                    >
                                        {term}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                                    Matching Documents
                                </p>
                                <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                    검색과 가장 가까운 문서
                                </h2>
                            </div>
                            <Link
                                href="/docs"
                                className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                            >
                                전체 문서 보기
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                            {docs.map((doc) => (
                                <DocsIndexCard key={doc.id} doc={doc} />
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        )
    }

    return (
        <main className="docs-shell px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <div className="space-y-8">
                <section className="rounded-[28px] border border-zinc-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,244,245,0.92))] p-6 shadow-[0_20px_60px_rgba(24,24,27,0.06)] dark:border-zinc-800 dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.92))] sm:p-8">
                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
                        <div className="space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                                Document Index
                            </p>
                            <div className="space-y-3">
                                <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
                                    모든 문서를 빠르게 찾는 인덱스
                                </h1>
                                <p className="max-w-2xl text-sm leading-7 text-zinc-500 dark:text-zinc-400 sm:text-base">
                                    `/docs`는 `feed`처럼 큐레이션을 보여주는
                                    화면이 아니라, 전체 문서를 빠르게 스캔하고
                                    필요한 글을 찾는 컨텍스트입니다. 검색, 섹션
                                    탐색, 최근 업데이트 확인을 이 페이지에서
                                    시작합니다.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {recommendations.map((term) => (
                                    <Link
                                        key={term}
                                        href={`/docs?q=${encodeURIComponent(term)}`}
                                        className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                                    >
                                        {term}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                            <div className="rounded-[22px] border border-zinc-200 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-950/80">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                                    Total Docs
                                </p>
                                <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                    {docs.length}
                                </p>
                            </div>
                            <div className="rounded-[22px] border border-zinc-200 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-950/80">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                                    Sections
                                </p>
                                <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                    {sectionSummary.length}
                                </p>
                            </div>
                            <div className="rounded-[22px] border border-zinc-200 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-950/80">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                                    Latest Update
                                </p>
                                <p className="mt-3 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                                    {latestUpdated ?? '업데이트 준비 중'}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                                Section Overview
                            </p>
                            <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                문서가 모여 있는 섹션
                            </h2>
                        </div>
                        <Link
                            href="/category"
                            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                        >
                            category 보기
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {sectionSummary.map((section) => (
                            <Link
                                key={section.key}
                                href={section.href}
                                className="group rounded-3xl border border-zinc-200/80 bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,24,27,0.04)] transition-all hover:-translate-y-0.5 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/90 dark:hover:border-zinc-700"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                                            {section.label}
                                        </p>
                                        <h3 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                                            문서 {section.count}개
                                        </h3>
                                        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                                            {section.description}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 transition-colors group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
                                            Open
                                        </span>
                                        {section.latest && (
                                            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                                                최근 {getTime(section.latest)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                                All Documents
                            </p>
                            <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                전체 문서 목록
                            </h2>
                        </div>
                        <Link
                            href="/feed"
                            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                        >
                            큐레이션 피드로 이동
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {docs.map((doc) => (
                            <DocsIndexCard key={doc.id} doc={doc} />
                        ))}
                    </div>
                </section>
            </div>
        </main>
    )
}
