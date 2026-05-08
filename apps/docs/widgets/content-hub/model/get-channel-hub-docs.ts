import { type DocChannel, isDocInChannel } from '~/lib/get-doc-channel'
import { getSubCategoryData } from '~/lib/get-category'
import { getSearchData, type SearchData } from '~/lib/get-search-data'
import { categoryTree } from '~/entities/category/model/category'

export type HubChannel = Extract<DocChannel, 'web' | 'mobile' | 'uiux'>

function sortDocsByDate(docs: SearchData[]) {
    return [...docs].sort((a, b) => {
        const aTime = a.date ? new Date(a.date).getTime() : 0
        const bTime = b.date ? new Date(b.date).getTime() : 0

        return bTime - aTime
    })
}

function dedupeDocsByHref(docs: SearchData[]) {
    return Array.from(new Map(docs.map((doc) => [doc.href, doc])).values())
}

async function getWebCategoryDocs() {
    const feCategory = categoryTree.find((category) => category.url === 'fe')

    if (!feCategory) {
        return []
    }

    const docs = await Promise.all(
        feCategory.sub.map(async (topic) => {
            const topicDocs = await getSubCategoryData('fe', topic.url)

            return topicDocs
                .filter((doc): doc is SearchData =>
                    Boolean(doc.slug && doc.id && doc.title)
                )
                .map((doc) => ({
                    id: String(doc.id),
                    title: doc.title,
                    summary: doc.summary ?? '',
                    content: doc.content ?? '',
                    slug: doc.slug!,
                    fileName:
                        doc.fileName ?? `category/fe/${topic.url}/${doc.slug}`,
                    date: doc.date,
                    thumbnail: doc.thumbnail ?? null,
                    href: `/category/fe/${topic.url}/${doc.slug}`,
                    section: 'Web',
                }))
        })
    )

    return docs.flat()
}

export async function getChannelHubDocs(channel: HubChannel) {
    const docs = await getSearchData()

    if (channel === 'web') {
        const webDocs = docs.filter((doc) => doc.section === 'Web')
        const categoryDocs = await getWebCategoryDocs()

        return sortDocsByDate(dedupeDocsByHref([...webDocs, ...categoryDocs]))
    }

    if (channel === 'uiux') {
        return sortDocsByDate(docs.filter((doc) => doc.section === 'UI/UX'))
    }

    return sortDocsByDate(
        docs.filter((doc) => isDocInChannel(channel, doc.fileName))
    )
}
