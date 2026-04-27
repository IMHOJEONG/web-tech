import { Metadata, getSortedPostsData } from '~/lib/get-document'

export type HubKey = 'feed' | 'web' | 'mobile' | 'uiux'

type Doc = Partial<Metadata>

function matchesPrefix(doc: Doc, prefixes: string[]) {
    return prefixes.some((prefix) => doc.fileName?.includes(prefix))
}

export function getHubDocs(hub: HubKey) {
    const docs = getSortedPostsData()

    switch (hub) {
        case 'feed':
            return docs
        case 'web':
            return docs.filter((doc) =>
                matchesPrefix(doc, [
                    'apps/docs/category/fe/',
                    'apps/docs/data/v8/',
                ])
            )
        case 'uiux':
            return docs.filter((doc) =>
                matchesPrefix(doc, ['apps/docs/data/shadcn/'])
            )
        case 'mobile':
            return docs.filter((doc) =>
                matchesPrefix(doc, ['apps/docs/category/mobile/'])
            )
        default:
            return docs
    }
}
