import type { Metadata } from './get-document.ts'
import { getDocHref } from './get-doc-route.ts'

export type ArticleRelatedDocument = Pick<
    Partial<Metadata>,
    | 'contentSource'
    | 'date'
    | 'fileName'
    | 'id'
    | 'markdownPath'
    | 'readMinutes'
    | 'slug'
    | 'summary'
    | 'tags'
    | 'title'
    | 'topicLabel'
>

export type ArticleRelatedDocumentItem = {
    contentSource?: Metadata['contentSource']
    date?: string
    href: string
    readMinutes?: number
    summary?: string
    tags: string[]
    title: string
    topicLabel?: string
}

type ScoredRelatedDocument = {
    doc: ArticleRelatedDocument
    score: number
}

const DEFAULT_RELATED_LIMIT = 3

function getIdentity(doc: ArticleRelatedDocument) {
    const href = getDocHref(doc)

    if (href !== '/docs') {
        return href
    }

    return String(doc.id ?? doc.markdownPath ?? doc.fileName ?? doc.slug ?? '')
}

function getSection(doc: ArticleRelatedDocument) {
    const href = getDocHref(doc)
    const [, docsPrefix, section, mainCategory, subCategory] = href.split('/')

    if (docsPrefix !== 'docs') {
        return null
    }

    if (section === 'category' && mainCategory && subCategory) {
        return `${section}/${mainCategory}/${subCategory}`
    }

    return section || null
}

function normalizeTags(tags?: string[]) {
    return new Set(
        (tags ?? [])
            .map((tag) => tag.trim().toLowerCase())
            .filter((tag) => tag.length > 0)
    )
}

function getSharedTagCount(
    currentDoc: ArticleRelatedDocument,
    candidate: ArticleRelatedDocument
) {
    const currentTags = normalizeTags(currentDoc.tags)
    const candidateTags = normalizeTags(candidate.tags)
    let count = 0

    for (const tag of candidateTags) {
        if (currentTags.has(tag)) {
            count += 1
        }
    }

    return count
}

function getRelatedScore(
    currentDoc: ArticleRelatedDocument,
    candidate: ArticleRelatedDocument
) {
    let score = 0
    const sharedTagCount = getSharedTagCount(currentDoc, candidate)

    score += sharedTagCount * 5

    if (
        currentDoc.topicLabel &&
        candidate.topicLabel &&
        currentDoc.topicLabel.toLowerCase() ===
            candidate.topicLabel.toLowerCase()
    ) {
        score += 3
    }

    if (getSection(currentDoc) === getSection(candidate)) {
        score += 2
    }

    return score
}

function compareByDateDesc(
    left: ArticleRelatedDocument,
    right: ArticleRelatedDocument
) {
    return String(right.date ?? '').localeCompare(String(left.date ?? ''))
}

function toRelatedItem(
    doc: ArticleRelatedDocument
): ArticleRelatedDocumentItem | null {
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
        tags: doc.tags ?? [],
        title: doc.title,
        topicLabel: doc.topicLabel,
    }
}

export function buildArticleRelatedDocuments(
    docs: ArticleRelatedDocument[],
    currentDoc: ArticleRelatedDocument,
    limit = DEFAULT_RELATED_LIMIT
): ArticleRelatedDocumentItem[] {
    const currentIdentity = getIdentity(currentDoc)
    const seen = new Set<string>([currentIdentity])
    const scoredDocs: ScoredRelatedDocument[] = []

    for (const doc of docs) {
        const identity = getIdentity(doc)

        if (!identity || seen.has(identity)) {
            continue
        }

        seen.add(identity)

        const score = getRelatedScore(currentDoc, doc)

        if (score > 0) {
            scoredDocs.push({ doc, score })
        }
    }

    return scoredDocs
        .sort((left, right) => {
            if (right.score !== left.score) {
                return right.score - left.score
            }

            return compareByDateDesc(left.doc, right.doc)
        })
        .slice(0, limit)
        .map(({ doc }) => toRelatedItem(doc))
        .filter((item) => item !== null)
}
