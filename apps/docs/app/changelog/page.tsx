import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { DOCS_GITHUB_REPO_URL } from '~/shared/config/external-links'
import { StaticPage } from '~/widgets/static-page/ui/static-page'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('staticPages.changelog.metadata')

    return {
        title: t('title'),
        description: t('description'),
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
        },
    }
}

export default async function ChangelogPage() {
    const t = await getTranslations('staticPages.changelog')

    return (
        <StaticPage
            eyebrow={t('eyebrow')}
            title={t('title')}
            description={t('description')}
            sections={[
                {
                    id: 'search',
                    title: t('sections.search.title'),
                    body: t('sections.search.body'),
                },
                {
                    id: 'contracts',
                    title: t('sections.contracts.title'),
                    body: t('sections.contracts.body'),
                },
                {
                    id: 'editorial',
                    title: t('sections.editorial.title'),
                    body: t('sections.editorial.body'),
                },
            ]}
            asideTitle={t('aside.title')}
            asideBody={t('aside.body')}
            asideLink={{
                href: DOCS_GITHUB_REPO_URL,
                label: t('aside.linkLabel'),
                external: true,
            }}
        />
    )
}
