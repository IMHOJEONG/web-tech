import 'server-only'

import fg from 'fast-glob'
import fs from 'fs/promises'
import path from 'path'
import { VFile } from 'vfile'
import { matter as vfileMatter } from 'vfile-matter'
import type { Metadata } from '~/lib/get-document'
import { fetchRemoteDocsData } from '~/lib/content-api'
import { normalizeDocPath } from '~/lib/normalize-doc-path'

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

    return `/docs/${slug}`
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

function buildSearchHaystack(doc: SearchData) {
    const pathTokens = doc.fileName.replace(/\//g, ' ').replace(/[-_]/g, ' ')

    return [
        doc.title,
        doc.summary,
        doc.slug,
        doc.section,
        pathTokens,
        doc.content,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
}

function sortByDateDesc<T extends { date?: string }>(docs: T[]) {
    return [...docs].sort((a, b) => {
        const aTime = a.date ? new Date(a.date).getTime() : 0
        const bTime = b.date ? new Date(b.date).getTime() : 0

        return bTime - aTime
    })
}

async function parseLocalSearchFile(filePath: string): Promise<SearchData> {
    const fileContents = await fs.readFile(filePath, 'utf8')
    const vfile = new VFile({ path: filePath, value: fileContents })
    vfileMatter(vfile, { strip: true })
    const data = (vfile.data.matter || {}) as {
        id?: string | number
        title?: string
        slug?: string
        summary?: string
        date?: string | number
        thumbnail?: string | null
    }
    const content = stripFrontmatter(String(vfile))
    const fileName = path
        .relative(process.cwd(), filePath)
        .replace(/\.(mdx|md)$/i, '')
    const normalizedFileName = normalizeDocPath(fileName)
    const slug =
        typeof data.slug === 'string' && data.slug.trim()
            ? data.slug.trim()
            : slugFromFileName(normalizedFileName)

    return {
        id: String(data.id ?? fileName),
        title:
            typeof data.title === 'string' && data.title.trim()
                ? data.title.trim()
                : slug,
        summary:
            typeof data.summary === 'string' && data.summary.trim()
                ? data.summary.trim()
                : content.slice(0, 140),
        content,
        slug,
        fileName: normalizedFileName,
        date:
            typeof data.date === 'string' || typeof data.date === 'number'
                ? String(data.date)
                : undefined,
        thumbnail: normalizeThumbnailPath(data.thumbnail),
        href: inferSearchHref(normalizedFileName, slug),
        section: inferSearchSection(normalizedFileName),
    }
}

function normalizeRemoteSearchDoc(doc: Partial<Metadata>): SearchData | null {
    if (!doc.slug) {
        return null
    }

    const fileName = normalizeDocPath(doc.fileName ?? `remote/${doc.slug}`)

    return {
        id: String(doc.id ?? doc.slug),
        title: doc.title ?? doc.slug,
        summary: doc.summary ?? '',
        content: doc.content ?? '',
        slug: doc.slug,
        fileName,
        date: doc.date,
        thumbnail: doc.thumbnail ?? null,
        href: `/docs/${doc.slug}`,
        section: inferSearchSection(fileName),
    }
}

async function getLocalSearchDocs() {
    const files = await fg(LOCAL_SEARCH_PATTERNS, {
        cwd: process.cwd(),
        absolute: true,
    })

    const docs = await Promise.all(files.map(parseLocalSearchFile))
    return sortByDateDesc(docs)
}

export async function getSearchData(keyword?: string): Promise<SearchData[]> {
    const remoteDocs = await fetchRemoteDocsData()

    const docs = remoteDocs
        ? sortByDateDesc(
              remoteDocs
                  .map(normalizeRemoteSearchDoc)
                  .filter((doc): doc is SearchData => doc !== null)
          )
        : await getLocalSearchDocs()

    const normalizedKeyword = keyword?.trim().toLowerCase()

    if (!normalizedKeyword) {
        return docs
    }

    return docs.filter((doc) =>
        buildSearchHaystack(doc).includes(normalizedKeyword)
    )
}
