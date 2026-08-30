import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { buildPageMetadata } from '~/lib/page-metadata'
import { AboutUs } from '~/widgets/about-us/ui/about-us'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('about.metadata')

    return buildPageMetadata({
        pathname: '/about',
        title: t('title'),
        description: t('description'),
        ogTitle: t('ogTitle'),
        ogDescription: t('ogDescription'),
    })
}

export default function Page() {
    return <AboutUs />
}
