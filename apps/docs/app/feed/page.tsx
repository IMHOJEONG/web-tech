import { getSortedPostsData } from '~/lib/get-document'
import { MainFeed, normalizeFeedFilter } from '~/widgets/m/ui/main-feed'

type Props = {
    searchParams: Promise<{
        topic?: string
    }>
}

export default async function Page({ searchParams }: Props) {
    const { topic } = await searchParams
    const docs = await getSortedPostsData()
    const activeFilter = normalizeFeedFilter(topic)

    return <MainFeed docs={docs} activeFilter={activeFilter} />
}
