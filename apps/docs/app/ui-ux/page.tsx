import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { buildPageMetadata } from '~/lib/page-metadata'
import { UiUxHubPage } from '~/widgets/content-hub/ui/uiux-hub-page'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('metadata.pages.uiux')

    return buildPageMetadata({
        pathname: '/ui-ux',
        title: t('title'),
        description: t('description'),
        ogTitle: t('ogTitle'),
        ogDescription: t('ogDescription'),
    })
}

export default function Page() {
    return <UiUxHubPage />
}
