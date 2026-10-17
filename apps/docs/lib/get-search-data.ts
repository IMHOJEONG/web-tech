import 'server-only'

import type { ContentSource, Metadata } from '~/lib/get-document'
import { getDocHref } from '~/lib/get-doc-route'
import { fetchRemoteDocsData } from '~/lib/content-api'
import { shouldIncludeRemoteContentIndex } from '~/lib/content-api-config'
import {
    logContentSource,
    resolveCollectionContentSource,
} from '~/lib/content-source-log'
import { getLocalSearchIndex } from './local-search-cache'
import { inferSearchSection } from './local-search-index'
import { normalizeDocPath } from '~/lib/normalize-doc-path'
import { rankSearchDocs } from '~/lib/search-ranking'
import { normalizeSearchQuery } from '~/shared/lib/search-query'
import { getRequestObservation } from '~/lib/request-observation'
import { createArticleTiming } from '~/lib/article-timing'
import type { ArticleTimingMeasure } from '~/lib/article-timing.types'
export interface SearchData {
    readonly id: string
    readonly title?: string
    readonly summary?: string
    readonly content: string
    readonly slug: string
    readonly fileName: string
    readonly date?: string
    readonly updatedAt?: string
    readonly thumbnail?: string | null
    readonly href: string
    readonly section: string
    readonly contentSource: ContentSource
    readonly readMinutes?: number
    readonly topicLabel?: string
    readonly tags?: readonly string[]
}

function sortByDateDesc<T extends { date?: string }>(docs: T[]) {
    return [...docs].sort((a, b) => {
        const aTime = a.date ? new Date(a.date).getTime() : 0
        const bTime = b.date ? new Date(b.date).getTime() : 0

        return bTime - aTime
    })
}

function normalizeRemoteSearchDoc(doc: Partial<Metadata>): SearchData | null {
    if (!doc.slug) {
        return null
    }

    const fileName = normalizeDocPath(doc.fileName ?? `remote/${doc.slug}`)
    const href = getDocHref({
        slug: doc.slug,
        markdownPath: doc.markdownPath,
        fileName,
    })
    const routeKey = doc.markdownPath ?? fileName

    return {
        id: String(doc.id ?? routeKey ?? doc.slug),
        title: doc.title ?? doc.slug,
        summary: doc.summary ?? '',
        content: doc.content ?? '',
        slug: doc.slug,
        fileName,
        date: doc.date,
        updatedAt: doc.updatedAt,
        thumbnail: doc.thumbnail ?? null,
        href,
        section: inferSearchSection(fileName),
        contentSource: 'remote',
        readMinutes: doc.readMinutes,
        topicLabel: doc.topicLabel,
        tags: doc.tags,
    }
}

async function getRemoteSearchDocs(measure: ArticleTimingMeasure) {
    try {
        const remoteDocs = await measure('search-remote', fetchRemoteDocsData)

        if (!remoteDocs) {
            return []
        }

        return remoteDocs
            .map(normalizeRemoteSearchDoc)
            .filter((doc): doc is SearchData => doc !== null)
    } catch (error) {
        console.warn(
            '[docs] Remote search index unavailable. Searching local docs only.',
            error
        )
        return []
    }
}

function mergeSearchDocs(localDocs: SearchData[], remoteDocs: SearchData[]) {
    const seenHrefs = new Set<string>()
    const mergedDocs: SearchData[] = []

    for (const doc of [...remoteDocs, ...localDocs]) {
        if (seenHrefs.has(doc.href)) {
            continue
        }

        seenHrefs.add(doc.href)
        mergedDocs.push(doc)
    }

    return mergedDocs
}

type SearchDataOptions = {
    includeRemote?: boolean
    observeRequest?: boolean
}

export async function getSearchData(
    keyword?: string,
    options: SearchDataOptions = {}
): Promise<SearchData[]> {
    const { measure, requestId } = options.observeRequest
        ? await getRequestObservation()
        : { measure: createArticleTiming(), requestId: null }
    const localDocs = await measure('search-local', getLocalSearchIndex)
    const includeRemote =
        options.includeRemote ?? shouldIncludeRemoteContentIndex()
    const remoteDocs = includeRemote ? await getRemoteSearchDocs(measure) : []
    const docs = sortByDateDesc(mergeSearchDocs(localDocs, remoteDocs))
    const normalizedKeyword = normalizeSearchQuery(keyword).toLowerCase()

    logContentSource({
        requestId,
        area: 'search',
        source: resolveCollectionContentSource(
            localDocs.length,
            remoteDocs.length
        ),
        reason: includeRemote
            ? 'remote-index-enabled'
            : 'remote-index-disabled',
        keyword: normalizedKeyword ? '[provided]' : undefined,
        includeRemote,
        localCount: localDocs.length,
        remoteCount: remoteDocs.length,
        totalCount: docs.length,
    })

    if (!normalizedKeyword) {
        return docs
    }

    return measure('search-rank', () => rankSearchDocs(docs, normalizedKeyword))
}
