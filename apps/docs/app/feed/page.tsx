import { getSortedPostsData } from '~/lib/get-document'
import { MainFeed } from '~/widgets/m/ui/main-feed'

export default async function Page() {
    const docs = await getSortedPostsData()
    return <MainFeed docs={docs} />
}
