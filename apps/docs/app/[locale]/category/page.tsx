import { Link } from '~/shared/i18n/navigation'
import { MainContent } from '~/shared/ui/main-content'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import {
    categoryTree,
    makeCategoryUrl,
} from '~/entities/category/model/category'
import { MainCategoryCard } from '~/entities/category/ui/main-category-card'
import { getMainCategoryOverview } from '~/lib/get-category'
import { buildPageMetadata } from '~/lib/localized-metadata'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('metadata.pages.category')

    return buildPageMetadata({
        pathname: '/category',
        title: t('title'),
        description: t('description'),
        ogTitle: t('ogTitle'),
        ogDescription: t('ogDescription'),
    })
}

export default async function Page() {
    const t = await getTranslations('category')
    const summaries = await getTranslations('category.summaries')
    const mainCategories = categoryTree.map((category) => ({
        ...category,
        href: makeCategoryUrl([category.url]),
    }))
    const categoryOverview = await getMainCategoryOverview()

    const popularTopics = categoryTree.flatMap((category) =>
        category.sub.map((topic) => ({
            title: topic.title,
            href: makeCategoryUrl([category.url, topic.url]),
            group: category.title,
        }))
    )

    return (
        <MainContent className="docs-shell px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <div className="space-y-10">
                <section className="ds-panel relative overflow-hidden p-6 sm:p-8">
                    <div className="max-w-3xl space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-outline">
                            {t('index.label')}
                        </p>
                        <h1 className="text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
                            {t('index.title')}
                        </h1>
                        <p className="text-sm leading-7 text-on-surface-variant sm:text-base">
                            {t('index.description')}
                        </p>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-outline">
                            {t('index.groupsLabel')}
                        </p>
                        <h2 className="text-2xl font-bold tracking-tight text-on-surface">
                            {t('index.groupsTitle')}
                        </h2>
                    </div>

                    <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {mainCategories.map((category) =>
                            (() => {
                                const overview = categoryOverview.find(
                                    (item) => item.url === category.url
                                )

                                return (
                                    <Link
                                        key={category.href}
                                        href={category.href}
                                        className="group ds-card bg-surface-container-lowest p-4 hover:-translate-y-1"
                                    >
                                        <MainCategoryCard
                                            title={category.title}
                                            summary={summaries(
                                                category.summaryKey
                                            )}
                                            icon={category.icon}
                                        />
                                        <div className="mt-3 border-t border-outline-variant pt-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-xs font-semibold tracking-[0.18em] text-outline uppercase">
                                                    {category.title}
                                                </span>
                                                <span className="ds-chip-muted px-2.5 py-1 text-xs font-medium normal-case tracking-normal">
                                                    {t('documentCount', {
                                                        count:
                                                            overview?.docCount ??
                                                            0,
                                                    })}
                                                </span>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {category.sub.map((topic) => (
                                                    <span
                                                        key={topic.url}
                                                        className="ds-chip-muted px-2.5 py-1 text-xs normal-case tracking-normal"
                                                    >
                                                        {topic.title}
                                                    </span>
                                                ))}
                                            </div>
                                            {overview?.latestTitle ? (
                                                <div className="ds-panel-muted mt-4 px-3 py-3">
                                                    <p className="text-[11px] font-semibold tracking-[0.18em] text-outline uppercase">
                                                        {t('latestUpdate')}
                                                    </p>
                                                    <p className="mt-2 text-sm font-medium text-on-surface">
                                                        {overview.latestTitle}
                                                    </p>
                                                    {overview.latestDate ? (
                                                        <p className="mt-1 text-xs text-on-surface-variant">
                                                            {
                                                                overview.latestDate
                                                            }
                                                        </p>
                                                    ) : null}
                                                </div>
                                            ) : null}
                                        </div>
                                    </Link>
                                )
                            })()
                        )}
                    </div>
                </section>

                <section className="space-y-4 border-t border-outline-variant pt-8">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-outline">
                            {t('index.topicsLabel')}
                        </p>
                        <h2 className="text-2xl font-bold tracking-tight text-on-surface">
                            {t('index.topicsTitle')}
                        </h2>
                        <p className="text-sm leading-6 text-on-surface-variant">
                            {t('index.topicsDescription')}
                        </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {popularTopics.map((topic) => (
                            <Link
                                key={topic.href}
                                href={topic.href}
                                className="ds-card bg-surface-container-lowest px-4 py-3"
                            >
                                <p className="text-sm font-semibold text-on-surface">
                                    {topic.title}
                                </p>
                                <p className="mt-1 text-xs tracking-[0.18em] text-outline uppercase">
                                    {topic.group}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </MainContent>
    )
}
