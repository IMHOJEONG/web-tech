import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ContentPending } from '~/shared/ui/content-pending'
import type { HubSearchParams } from '~/widgets/content-hub/model/hub-topic-filter'
import { getTranslations } from 'next-intl/server'
import { buildPageMetadata } from '~/lib/localized-metadata'
import { ChannelHubPage } from '~/widgets/content-hub/ui/channel-hub-page'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('metadata.pages.web')

    return buildPageMetadata({
        pathname: '/web',
        title: t('title'),
        description: t('description'),
        ogTitle: t('ogTitle'),
        ogDescription: t('ogDescription'),
    })
}

export default function Page({
    searchParams,
}: {
    searchParams: HubSearchParams
}) {
    return (
        <Suspense fallback={<ContentPending />}>
            <ChannelHubPage channel="web" searchParams={searchParams} />
        </Suspense>
    )
}
