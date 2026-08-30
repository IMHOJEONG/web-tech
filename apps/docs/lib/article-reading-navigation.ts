import type { Metadata } from './get-document.ts'
import { getDocHref } from './get-doc-route.ts'

export type ArticleReadingNavigationDoc = Pick<
    Partial<Metadata>,
    | 'contentSource'
    | 'date'
    | 'fileName'
    | 'id'
    | 'markdownPath'
    | 'readMinutes'
    | 'slug'
    | 'summary'
    | 'title'
    | 'topicLabel'
    | 'updatedAt'
>

export type ArticleReadingNavigationItem = {
    contentSource?: Metadata['contentSource']
    date?: string
    href: string
    readMinutes?: number
    summary?: string
    title: string
    topicLabel?: string
}

export type ArticleReadingNavigation = {
    lastUpdated?: string
    next: ArticleReadingNavigationItem | null
    previous: ArticleReadingNavigationItem | null
}

function getIdentity(doc: ArticleReadingNavigationDoc) {
    const href = getDocHref(doc)

    if (href !== '/docs') {
        return href
    }

    return String(doc.id ?? doc.markdownPath ?? doc.fileName ?? doc.slug ?? '')
}

function toNavigationItem(
    doc: ArticleReadingNavigationDoc
): ArticleReadingNavigationItem | null {
    const href = getDocHref(doc)

    if (!doc.title || href === '/docs') {
        return null
    }

    return {
        contentSource: doc.contentSource,
        date: doc.date,
        href,
        readMinutes: doc.readMinutes,
        summary: doc.summary,
        title: doc.title,
        topicLabel: doc.topicLabel,
    }
}

function dedupeDocs(docs: ArticleReadingNavigationDoc[]) {
    const seen = new Set<string>()
    const uniqueDocs: ArticleReadingNavigationDoc[] = []

    for (const doc of docs) {
        const key = getIdentity(doc)

        if (!key || seen.has(key)) {
            continue
        }

        seen.add(key)
        uniqueDocs.push(doc)
    }

    return uniqueDocs
}

export function buildArticleReadingNavigation(
    docs: ArticleReadingNavigationDoc[],
    currentDoc: ArticleReadingNavigationDoc
): ArticleReadingNavigation {
    const currentIdentity = getIdentity(currentDoc)
    const uniqueDocs = dedupeDocs(docs)
    const currentIndex = uniqueDocs.findIndex(
        (doc) => getIdentity(doc) === currentIdentity
    )

    if (currentIndex === -1) {
        return {
            lastUpdated: currentDoc.updatedAt ?? currentDoc.date,
            next: null,
            previous: null,
        }
    }

    return {
        lastUpdated: currentDoc.updatedAt ?? currentDoc.date,
        next: toNavigationItem(uniqueDocs[currentIndex - 1] ?? {}),
        previous: toNavigationItem(uniqueDocs[currentIndex + 1] ?? {}),
    }
}
