import { type DocChannel, isDocInChannel } from '~/lib/get-doc-channel'
import { getSearchData } from '~/lib/get-search-data'

export type HubChannel = Extract<DocChannel, 'web' | 'mobile' | 'uiux'>

export async function getChannelHubDocs(channel: HubChannel) {
    // The merged index already selects one source per canonical route.
    const docs = await getSearchData()

    return docs
        .filter((doc) => isDocInChannel(channel, doc))
        .sort((a, b) => {
            const aTime = a.date ? new Date(a.date).getTime() : 0
            const bTime = b.date ? new Date(b.date).getTime() : 0

            return bTime - aTime
        })
}
