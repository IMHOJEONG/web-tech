import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { buildPageMetadata } from '~/lib/page-metadata'
import { ChannelHubPage } from '~/widgets/content-hub/ui/channel-hub-page'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('metadata.pages.mobile')

    return buildPageMetadata({
        pathname: '/mobile',
        title: t('title'),
        description: t('description'),
        ogTitle: t('ogTitle'),
        ogDescription: t('ogDescription'),
    })
}

export default function Page() {
    return <ChannelHubPage channel="mobile" />
}
