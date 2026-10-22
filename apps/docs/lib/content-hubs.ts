import { getSortedPostsData } from '~/lib/get-document'
import { isDocInChannel } from './get-doc-channel'

export type HubKey = 'feed' | 'web' | 'mobile' | 'uiux'

export async function getHubDocs(hub: HubKey) {
    const docs = await getSortedPostsData()

    return hub === 'feed'
        ? docs
        : docs.filter((doc) => isDocInChannel(hub, doc))
}
