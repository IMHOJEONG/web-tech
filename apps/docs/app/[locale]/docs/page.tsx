import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ContentPending } from '~/shared/ui/content-pending'
import { getTranslations } from 'next-intl/server'
import { DocsEmptyPage } from '~/widgets/docs-index/ui/docs-empty-page'
import {
    RECOMMENDED_SEARCH_TERMS,
    resolveDocsSearchPageState,
} from '~/lib/docs-search-page-state'
import { getSearchData } from '~/lib/get-search-data'
import { buildPageMetadata } from '~/lib/localized-metadata'
import { DocsIndex } from '~/widgets/docs-index/ui/docs-index'
import { resolveDocsIndexControls } from '~/widgets/docs-index/model/docs-index-controls'

type Props = {
    searchParams: Promise<{
        page?: string
        q?: string
        section?: string
        sort?: string
    }>
}

function parsePageParam(page?: string) {
    const pageNumber = Number.parseInt(page ?? '', 10)

    if (!Number.isFinite(pageNumber) || pageNumber < 1) {
        return 1
    }

    return pageNumber
}

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('metadata.pages.docs')

    return buildPageMetadata({
        pathname: '/docs',
        title: t('title'),
        description: t('description'),
        ogTitle: t('ogTitle'),
        ogDescription: t('ogDescription'),
    })
}

export default function Page(props: Props) {
    return (
        <Suspense fallback={<ContentPending />}>
            <DocsResults {...props} />
        </Suspense>
    )
}

async function DocsResults({ searchParams }: Props) {
    const { page, q, section, sort } = await searchParams
    const keyword = q?.trim() ?? ''
    const currentPage = parsePageParam(page)
    const controls = resolveDocsIndexControls({ section, sort })
    const docs = keyword ? [] : await getSearchData()
    const searchResults = keyword ? await getSearchData(keyword) : []
    const pageState = resolveDocsSearchPageState({
        query: q,
        docs,
        searchResults,
    })

    switch (pageState.mode) {
        case 'empty-all-docs':
        case 'empty-search':
            return (
                <DocsEmptyPage
                    state={pageState}
                    recommendations={RECOMMENDED_SEARCH_TERMS}
                />
            )
        case 'index':
            return (
                <DocsIndex
                    currentPage={currentPage}
                    controls={controls}
                    docs={pageState.docs}
                    recommendations={RECOMMENDED_SEARCH_TERMS}
                />
            )
        case 'search-results':
            return (
                <DocsIndex
                    controls={controls}
                    docs={pageState.docs}
                    keyword={pageState.keyword}
                    recommendations={RECOMMENDED_SEARCH_TERMS}
                />
            )
    }

    return (
        <DocsIndex
            currentPage={currentPage}
            controls={controls}
            docs={docs}
            recommendations={RECOMMENDED_SEARCH_TERMS}
        />
    )
}
