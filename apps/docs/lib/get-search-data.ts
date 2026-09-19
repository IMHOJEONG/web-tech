import 'server-only'

import fg from 'fast-glob'
import fs from 'fs/promises'
import { parseLocalDocument } from './local-document-parser'
import type { ContentSource, Metadata } from '~/lib/get-document'
import { getDocHref } from '~/lib/get-doc-route'
import { fetchRemoteDocsData } from '~/lib/content-api'
import { shouldIncludeRemoteContentIndex } from '~/lib/content-api-config'
import {
    logContentSource,
    resolveCollectionContentSource,
} from '~/lib/content-source-log'
import {
    resolveLocalContentRoot,
    toLocalContentFileName,
} from '~/lib/local-content-paths'
import { normalizeDocPath } from '~/lib/normalize-doc-path'
import { rankSearchDocs } from '~/lib/search-ranking'
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

const LOCAL_SEARCH_PATTERNS = ['data/**/*.{md,mdx}', 'category/**/*.{md,mdx}']

function inferSearchHref(fileName: string, slug: string) {
    return getDocHref({ fileName, slug })
}

function inferSearchSection(fileName: string) {
    if (fileName.startsWith('category/fe/')) {
        return 'Web'
    }

    if (fileName.startsWith('category/be/')) {
        return 'Backend'
    }

    if (fileName.startsWith('category/computer-science/')) {
        return 'Computer Science'
    }

    if (fileName.startsWith('category/infra/')) {
        return 'Infrastructure'
    }

    if (fileName.startsWith('data/shadcn/')) {
        return 'UI/UX'
    }

    if (fileName.startsWith('data/v8/')) {
        return 'Web'
    }

    return 'Docs'
}

function sortByDateDesc<T extends { date?: string }>(docs: T[]) {
    return [...docs].sort((a, b) => {
        const aTime = a.date ? new Date(a.date).getTime() : 0
        const bTime = b.date ? new Date(b.date).getTime() : 0

        return bTime - aTime
    })
}

async function parseLocalSearchFile(
    filePath: string
): Promise<SearchData | null> {
    const fileContents = await fs.readFile(filePath, 'utf8')
    const doc = parseLocalDocument(
        filePath,
        toLocalContentFileName(filePath),
        fileContents
    )
    if (!doc) return null
    // The common parser already removed frontmatter; preserve body separators.
    const content = doc.content.trim()

    return {
        id: doc.id,
        title: doc.title,
        summary: doc.summary,
        content,
        slug: doc.slug,
        fileName: doc.fileName,
        date: doc.date || undefined,
        thumbnail: doc.thumbnail,
        updatedAt: doc.updatedAt,
        href: inferSearchHref(doc.fileName, doc.slug),
        section: inferSearchSection(doc.fileName),
        contentSource: 'local',
        readMinutes: doc.readMinutes,
        topicLabel: doc.topicLabel,
        tags: doc.tags,
    }
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

async function getLocalSearchDocs() {
    const files = await fg(LOCAL_SEARCH_PATTERNS, {
        cwd: resolveLocalContentRoot(),
        absolute: true,
    })

    const docs = (await Promise.all(files.map(parseLocalSearchFile))).filter(
        (doc): doc is SearchData => doc !== null
    )
    return sortByDateDesc(docs)
}

async function getRemoteSearchDocs() {
    try {
        const remoteDocs = await fetchRemoteDocsData()

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
}

export async function getSearchData(
    keyword?: string,
    options: SearchDataOptions = {}
): Promise<SearchData[]> {
    const localDocs = await getLocalSearchDocs()
    const includeRemote =
        options.includeRemote ?? shouldIncludeRemoteContentIndex()
    const remoteDocs = includeRemote ? await getRemoteSearchDocs() : []
    const docs = sortByDateDesc(mergeSearchDocs(localDocs, remoteDocs))
    const normalizedKeyword = keyword?.trim().toLowerCase()

    logContentSource({
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

    return rankSearchDocs(docs, normalizedKeyword)
}
