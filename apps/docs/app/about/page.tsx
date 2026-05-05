import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AboutUs } from '~/widgets/about-us/ui/about-us'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('about.metadata')

    return {
        title: t('title'),
        description: t('description'),
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
        },
    }
}

export default function Page() {
    return <AboutUs />
}
