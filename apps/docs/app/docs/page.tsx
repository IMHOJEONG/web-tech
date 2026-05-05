import Link from 'next/link'
import MainCard from '~/entities/document/ui/main-card'
import { EmptyAllDocs } from '~/feature/search/empty-all-docs'
import { EmptySearchResult } from '~/feature/search/empty-search-result'
import { getSortedPostsData } from '~/lib/get-document'
import { getSearchData } from '~/lib/get-search-data'
import { MainFeed } from '~/widgets/m/ui/main-feed'

type Props = {
    searchParams: { q?: string }
}

const RECOMMENDED_SEARCH_TERMS = [
    'React',
    'Astro',
    'Accessibility',
    'V8',
    'Node.js',
    'OS',
]

export default async function Page({ searchParams }: Props) {
    const { q } = await searchParams
    const keyword = q?.trim() ?? ''
    const docs = keyword ? [] : await getSortedPostsData()
    const searchResults = keyword ? await getSearchData(keyword) : []

    if (!q && docs.length === 0) {
        return <EmptyAllDocs />
    }

    if (keyword && searchResults.length === 0) {
        return (
            <main className="docs-shell px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
                <section className="space-y-6">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                            Search Results
                        </p>
                        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
                            문서를 찾지 못했어요.
                        </h1>
                    </div>
                    <EmptySearchResult
                        keyword={keyword}
                        recommendations={RECOMMENDED_SEARCH_TERMS}
                    />
                </section>
            </main>
        )
    }

    if (!keyword) {
        return <MainFeed docs={docs} />
    }

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
                            제목, 요약, 분류 정보, 본문을 기준으로 관련 문서를
                            정리했습니다. 가장 최근 문서부터 먼저 보여줍니다.
                        </p>
                        <div className="flex flex-wrap gap-2 pt-2">
                            <span className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                                {searchResults.length} results
                            </span>
                            {RECOMMENDED_SEARCH_TERMS.map((term) => (
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

                <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 md:grid-cols-1">
                    {searchResults.map((doc) => {
                        if (!doc.slug) {
                            return null
                        }

                        return (
                            <Link
                                href={doc.href}
                                key={doc.id}
                                className="size-full"
                            >
                                <MainCard doc={doc} />
                            </Link>
                        )
                    })}
                </div>
            </div>
        </main>
    )
}
