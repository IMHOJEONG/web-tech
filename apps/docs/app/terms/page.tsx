import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { StaticPage } from '~/widgets/static-page/ui/static-page'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('staticPages.terms.metadata')

    return {
        title: t('title'),
        description: t('description'),
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
        },
    }
}

export default async function TermsPage() {
    const t = await getTranslations('staticPages.terms')

    return (
        <StaticPage
            eyebrow={t('eyebrow')}
            title={t('title')}
            description={t('description')}
            sections={[
                {
                    id: 'reference',
                    title: t('sections.reference.title'),
                    body: t('sections.reference.body'),
                },
                {
                    id: 'availability',
                    title: t('sections.availability.title'),
                    body: t('sections.availability.body'),
                },
                {
                    id: 'links',
                    title: t('sections.links.title'),
                    body: t('sections.links.body'),
                },
            ]}
            asideTitle={t('aside.title')}
            asideBody={t('aside.body')}
            asideLink={{
                href: '/privacy',
                label: t('aside.linkLabel'),
            }}
        />
    )
}
