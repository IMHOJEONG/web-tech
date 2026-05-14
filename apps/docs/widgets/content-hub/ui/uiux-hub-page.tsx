import { getLocale, getTranslations } from 'next-intl/server'
import { getChannelHubDocs } from '~/widgets/content-hub/model/get-channel-hub-docs'
import type { SearchData } from '~/lib/get-search-data'
import { UiUxHubFeaturedSection } from './uiux-hub-featured-section'
import { UiUxHubHero } from './uiux-hub-hero'
import { UiUxHubMoreArticlesSection } from './uiux-hub-more-articles-section'
import { UiUxHubNewsletterSection } from './uiux-hub-newsletter-section'
import type { UiUxDoc } from './uiux-hub.types'

function toUiUxDoc(doc: SearchData | undefined): UiUxDoc | null {
    if (!doc?.title || !doc.href) {
        return null
    }

    return {
        ...doc,
        title: doc.title,
        href: doc.href,
        summary: doc.summary?.trim() || 'Open the article to continue reading.',
    }
}

function makeFallbackDoc(
    href: string,
    title: string,
    summary: string,
    id: string
): UiUxDoc {
    return {
        id,
        title,
        summary,
        content: '',
        slug: id,
        fileName: `fallback/${id}`,
        href,
        section: 'UI/UX',
    }
}

export async function UiUxHubPage() {
    const locale = await getLocale()
    const t = await getTranslations('uiuxHub')
    const isKorean = locale === 'ko'
    const docs = (await getChannelHubDocs('uiux'))
        .map(toUiUxDoc)
        .filter(Boolean)
    const renderedDocs = docs as UiUxDoc[]

    const fallbackHref = '/feed?topic=uiux'
    const featured =
        renderedDocs[0] ??
        makeFallbackDoc(
            fallbackHref,
            t('fallback.featured.title'),
            t('fallback.featured.summary'),
            'uiux-fallback-featured'
        )
    const secondaryOne =
        renderedDocs[1] ??
        makeFallbackDoc(
            fallbackHref,
            t('fallback.secondaryOne.title'),
            t('fallback.secondaryOne.summary'),
            'uiux-fallback-secondary-one'
        )
    const secondaryTwo =
        renderedDocs[2] ??
        makeFallbackDoc(
            fallbackHref,
            t('fallback.secondaryTwo.title'),
            t('fallback.secondaryTwo.summary'),
            'uiux-fallback-secondary-two'
        )
    const tutorial =
        renderedDocs[3] ??
        makeFallbackDoc(
            fallbackHref,
            t('fallback.tutorial.title'),
            t('fallback.tutorial.summary'),
            'uiux-fallback-tutorial'
        )
    const moreArticles = (
        renderedDocs.slice(4, 7).length > 0
            ? renderedDocs.slice(4, 7)
            : [
                  makeFallbackDoc(
                      fallbackHref,
                      t('fallback.moreOne.title'),
                      t('fallback.moreOne.summary'),
                      'uiux-fallback-more-one'
                  ),
                  makeFallbackDoc(
                      fallbackHref,
                      t('fallback.moreTwo.title'),
                      t('fallback.moreTwo.summary'),
                      'uiux-fallback-more-two'
                  ),
                  makeFallbackDoc(
                      fallbackHref,
                      t('fallback.moreThree.title'),
                      t('fallback.moreThree.summary'),
                      'uiux-fallback-more-three'
                  ),
              ]
    ).slice(0, 3)

    return (
        <main className="docs-shell overflow-x-clip px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <div className="space-y-10 lg:space-y-14">
                <UiUxHubHero
                    eyebrow={t('hero.eyebrow')}
                    titleLineOne={t('hero.titleLineOne')}
                    titleLineTwo={t('hero.titleLineTwo')}
                    description={t('hero.description')}
                />

                <UiUxHubFeaturedSection
                    featured={featured}
                    secondaryOne={secondaryOne}
                    secondaryTwo={secondaryTwo}
                    primaryLabel={t('featured.primaryLabel')}
                    secondaryLabel={t('featured.secondaryLabel')}
                    actionLabel={t('featured.action')}
                    researchLabel={t('secondary.researchLabel')}
                    guideLabel={t('secondary.guideLabel')}
                />

                <UiUxHubNewsletterSection
                    tutorial={tutorial}
                    tutorialLabel={t('bottomLeft.label')}
                    newsletterTitle={t('newsletter.title')}
                    newsletterDescription={t('newsletter.description')}
                    newsletterPlaceholder={t('newsletter.placeholder')}
                    newsletterButton={t('newsletter.button')}
                    isKorean={isKorean}
                />

                <UiUxHubMoreArticlesSection
                    moreArticles={moreArticles}
                    fallbackDate={t('more.fallbackDate')}
                    loadMoreLabel={t('loadMore')}
                />
            </div>
        </main>
    )
}
