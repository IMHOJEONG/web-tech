import { getDocChannel } from '~/lib/get-doc-channel'
import { getDocHref } from '~/lib/get-doc-route'
import type { Metadata } from '~/lib/get-document'
import { normalizeDocPath } from '~/lib/normalize-doc-path'

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
    const fileName = normalizeDocPath(doc.fileName ?? '')
    if (fileName.includes('/category/fe/') || fileName.includes('/data/v8/'))
        return 'WEB'
    if (fileName.includes('/data/shadcn/')) return 'UI/UX'
    if (fileName.includes('/category/computer-science/')) return 'SYSTEMS'
    if (fileName.includes('/category/be/')) return 'ARCHITECTURE'
    return 'ENGINEERING'
}

export function getFeedArticles(
    docs: Partial<Metadata>[],
    filter: FeedFilter
): FeedArticle[] {
    return docs.flatMap((doc) => {
        const title = doc.title?.trim()
        const slug = doc.slug?.trim()
        if (!title || !slug) return []
        const channel = getDocChannel(doc.fileName)
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
