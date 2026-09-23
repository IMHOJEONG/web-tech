import { getTranslations } from 'next-intl/server'
import { MainContent } from '~/shared/ui/main-content'
import { Link } from '~/shared/i18n/navigation'
import { getChannelHubDocs } from '../model/get-channel-hub-docs'
import { selectUiUxHubDocs } from '../model/uiux-hub-docs'
import { UiUxHubFeaturedSection } from './uiux-hub-featured-section'
import { UiUxHubHero } from './uiux-hub-hero'
import { UiUxHubMoreArticlesSection } from './uiux-hub-more-articles-section'
import { UiUxHubTutorialSection } from './uiux-hub-tutorial-section'

export async function UiUxHubPage() {
    const t = await getTranslations('uiuxHub')
    const { featured, spotlight, more, isEmpty } = selectUiUxHubDocs(
        await getChannelHubDocs('uiux')
    )

    return (
        <MainContent className="docs-shell overflow-x-clip px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <div className="space-y-10 lg:space-y-14">
                <UiUxHubHero
                    eyebrow={t('hero.eyebrow')}
                    titleLineOne={t('hero.titleLineOne')}
                    titleLineTwo={t('hero.titleLineTwo')}
                    description={t('hero.description')}
                />
                {isEmpty ? (
                    <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-6 sm:p-8">
                        <h2 className="text-xl font-semibold text-on-surface">
                            {t('empty.title')}
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                            {t('empty.description')}
                        </p>
                        <Link
                            href="/docs"
                            className="mt-5 inline-flex min-h-11 items-center font-semibold text-[var(--docs-interactive-text)] underline underline-offset-4"
                        >
                            {t('empty.action')}
                        </Link>
                    </section>
                ) : (
                    <>
                        <UiUxHubFeaturedSection docs={featured} />
                        {spotlight && (
                            <UiUxHubTutorialSection tutorial={spotlight} />
                        )}
                        <UiUxHubMoreArticlesSection
                            moreArticles={more}
                            fallbackDate={t('more.fallbackDate')}
                        />
                        <div className="flex justify-center border-t border-outline-variant pt-6">
                            <Link
                                href="/feed?topic=uiux"
                                className="inline-flex min-h-11 items-center rounded-full border border-outline-variant px-5 py-2 text-sm font-semibold text-on-surface transition-colors hover:border-primary hover:text-[var(--docs-interactive-text)]"
                            >
                                {t('browseFeed')}
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </MainContent>
    )
}
