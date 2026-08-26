import 'server-only'

import fg from 'fast-glob'
import fs from 'fs/promises'
import { VFile } from 'vfile'
import { matter as vfileMatter } from 'vfile-matter'
import {
    assertValidLocalDocFrontmatter,
    isPublicDocStatus,
    normalizeLocalDocFrontmatter,
} from '~/lib/editorial-metadata'
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
import { DEFAULT_LOCAL_DOCUMENT_THUMBNAIL } from '~/shared/assets/default-thumbnails'

export type SearchData = {
    id: string
    title?: string
    summary?: string
    content: string
    slug: string
    fileName: string
    date?: string
    thumbnail?: string | null
    href: string
    section: string
    contentSource: ContentSource
    readMinutes?: number
    topicLabel?: string
    tags?: string[]
}

const LOCAL_SEARCH_PATTERNS = ['data/**/*.{md,mdx}', 'category/**/*.{md,mdx}']

function normalizeThumbnailPath(thumbnail?: unknown) {
    if (typeof thumbnail !== 'string') {
        return null
    }

    const trimmed = thumbnail.trim()

    if (!trimmed) {
        return null
    }

    let thumbnailPath = trimmed
    const idx = thumbnailPath.indexOf('public/')

    if (idx !== -1) {
        thumbnailPath = thumbnailPath.slice(idx + 'public/'.length)
    }

    if (!thumbnailPath.startsWith('/')) {
        thumbnailPath = `/${thumbnailPath}`
    }

    return thumbnailPath
}

function stripFrontmatter(value: string) {
    return value.replace(/---[\s\S]*?---/, '').trim()
}

function slugFromFileName(fileName: string) {
    return fileName.split('/').filter(Boolean).pop() ?? ''
}

function inferSearchHref(fileName: string, slug: string) {
    const segments = fileName.split('/').filter(Boolean)

    if (segments[0] === 'category' && segments.length >= 4) {
        const [, main, sub] = segments
        return `/category/${main}/${sub}/${slug}`
    }

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
    const vfile = new VFile({ path: filePath, value: fileContents })
    vfileMatter(vfile, { strip: true })
    const frontmatter = normalizeLocalDocFrontmatter(vfile.data.matter || {})
    assertValidLocalDocFrontmatter(filePath, frontmatter)

    if (!isPublicDocStatus(frontmatter.status)) {
        return null
    }

    const content = stripFrontmatter(String(vfile))
    const fileName = toLocalContentFileName(filePath)
    const normalizedFileName = normalizeDocPath(fileName)
    const slug =
        frontmatter.slug?.trim() || slugFromFileName(normalizedFileName)

    return {
        id: frontmatter.id ?? normalizedFileName,
        title: frontmatter.title ?? slug,
        summary: frontmatter.summary ?? content.slice(0, 140),
        content,
        slug,
        fileName: normalizedFileName,
        date:
            frontmatter.date && frontmatter.date.trim()
                ? frontmatter.date
                : undefined,
        thumbnail:
            normalizeThumbnailPath(frontmatter.thumbnail) ??
            DEFAULT_LOCAL_DOCUMENT_THUMBNAIL,
        href: inferSearchHref(normalizedFileName, slug),
        section: inferSearchSection(normalizedFileName),
        contentSource: 'local',
        readMinutes: frontmatter.readMinutes,
        topicLabel: frontmatter.topicLabel,
        tags: frontmatter.tags,
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
