import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ContentPending } from '~/shared/ui/content-pending'
import { getTranslations } from 'next-intl/server'
import { getSortedPostsData } from '~/lib/get-document'
import { buildPageMetadata } from '~/lib/localized-metadata'
import { MainFeed, normalizeFeedFilter } from '~/widgets/m/ui/main-feed'

type Props = {
    searchParams: Promise<{
        topic?: string
    }>
}

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('metadata.pages.feed')

    return buildPageMetadata({
        pathname: '/feed',
        title: t('title'),
        description: t('description'),
        ogTitle: t('ogTitle'),
        ogDescription: t('ogDescription'),
    })
}

export default function Page(props: Props) {
    return (
        <Suspense fallback={<ContentPending />}>
            <FeedResults {...props} />
        </Suspense>
    )
}

async function FeedResults({ searchParams }: Props) {
    const { topic } = await searchParams
    const docs = await getSortedPostsData()
    const activeFilter = normalizeFeedFilter(topic)

    return <MainFeed docs={docs} activeFilter={activeFilter} />
}
