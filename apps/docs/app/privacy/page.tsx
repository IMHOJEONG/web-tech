import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { buildPageMetadata } from '~/lib/page-metadata'
import { StaticPage } from '~/widgets/static-page/ui/static-page'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('staticPages.privacy.metadata')

    return buildPageMetadata({
        pathname: '/privacy',
        title: t('title'),
        description: t('description'),
        ogTitle: t('ogTitle'),
        ogDescription: t('ogDescription'),
    })
}

export default async function PrivacyPage() {
    const t = await getTranslations('staticPages.privacy')

    return (
        <StaticPage
            eyebrow={t('eyebrow')}
            title={t('title')}
            description={t('description')}
            sections={[
                {
                    id: 'collection',
                    title: t('sections.collection.title'),
                    body: t('sections.collection.body'),
                },
                {
                    id: 'usage',
                    title: t('sections.usage.title'),
                    body: t('sections.usage.body'),
                },
                {
                    id: 'vendors',
                    title: t('sections.vendors.title'),
                    body: t('sections.vendors.body'),
                },
            ]}
            asideTitle={t('aside.title')}
            asideBody={t('aside.body')}
            asideLink={{
                href: '/changelog',
                label: t('aside.linkLabel'),
            }}
        />
    )
}
