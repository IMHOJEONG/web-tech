import { getSortedPostsData } from '~/lib/get-document'
import { MainFeed } from '~/widgets/main-feed'

export default function Page() {
    const docs = getSortedPostsData()
    return <MainFeed docs={docs} />
}
