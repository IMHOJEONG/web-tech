import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getSortedPostsData } from '~/lib/get-document'
import { buildPageMetadata } from '~/lib/page-metadata'
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

export default async function Page({ searchParams }: Props) {
    const { topic } = await searchParams
    const docs = await getSortedPostsData()
    const activeFilter = normalizeFeedFilter(topic)

    return <MainFeed docs={docs} activeFilter={activeFilter} />
}
