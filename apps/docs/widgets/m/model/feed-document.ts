import { getDocChannel } from '~/lib/get-doc-channel'
import { getDocHref } from '~/lib/get-doc-route'
import type { Metadata } from '~/lib/get-document'
import { getDocumentTaxonomy } from '~/lib/document-taxonomy'

export type FeedFilter = 'all' | 'web' | 'mobile' | 'uiux'
export type FeedArticle = {
    href: string
    title: string
    summary: string
    topic: string
    thumbnail?: string | null
    authorName: string
    readMinutes: number
}

export function normalizeFeedFilter(value?: string): FeedFilter {
    return value === 'web' || value === 'mobile' || value === 'uiux'
        ? value
        : 'all'
}

export function getFilterHref(filter: FeedFilter) {
    return filter === 'all' ? '/feed' : `/feed?topic=${filter}`
}

function getTopicLabel(doc: Partial<Metadata>) {
    if (doc.topicLabel?.trim()) return doc.topicLabel.trim()
    const section = getDocumentTaxonomy(doc).section
    switch (section) {
        case 'Web':
            return 'WEB'
        case 'Mobile':
            return 'MOBILE'
        case 'UI/UX':
            return 'UI/UX'
        case 'Computer Science':
            return 'SYSTEMS'
        case 'Backend':
            return 'ARCHITECTURE'
        default:
            return 'ENGINEERING'
    }
}

export function getFeedArticles(
    docs: Partial<Metadata>[],
    filter: FeedFilter
): FeedArticle[] {
    return docs.flatMap((doc) => {
        const title = doc.title?.trim()
        const slug = doc.slug?.trim()
        if (!title || !slug) return []
        const channel = getDocChannel(doc)
        if (
            filter !== 'all' &&
            (channel === 'other' ? 'web' : channel) !== filter
        )
            return []
        const summary =
            doc.summary?.trim() ||
            (doc.content ?? '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 160)
        return [
            {
                href: getDocHref({ ...doc, slug }),
                title,
                summary,
                topic: getTopicLabel(doc),
                thumbnail: doc.thumbnail,
                authorName: doc.authorName?.trim() || 'coder',
                readMinutes:
                    typeof doc.readMinutes === 'number' && doc.readMinutes > 0
                        ? doc.readMinutes
                        : Math.max(
                              5,
                              Math.ceil((doc.content?.trim().length ?? 0) / 420)
                          ),
            },
        ]
    })
}
