import { EmptyAllDocs } from '~/feature/search/empty-all-docs'
import { EmptySearchResult } from '~/feature/search/empty-search-result'
import { getSearchData } from '~/lib/get-search-data'
import { DocsIndex } from '~/widgets/docs-index/ui/docs-index'

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
    const docs = keyword ? [] : await getSearchData()
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
        return (
            <DocsIndex docs={docs} recommendations={RECOMMENDED_SEARCH_TERMS} />
        )
    }

    return (
        <DocsIndex
            docs={searchResults}
            keyword={keyword}
            recommendations={RECOMMENDED_SEARCH_TERMS}
        />
    )
}
