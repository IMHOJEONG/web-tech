import { RootLandingPage } from '~/widgets/root-landing/ui/root-landing-page'
import { getTranslations } from 'next-intl/server'
import { buildPageMetadata } from '~/lib/localized-metadata'

export async function generateMetadata() {
    const t = await getTranslations('metadata.site')
    return buildPageMetadata({
        pathname: '/',
        title: t('title'),
        description: t('description'),
        ogTitle: t('ogTitle'),
        ogDescription: t('ogDescription'),
    })
}

export default async function Page() {
    return <RootLandingPage />
}
