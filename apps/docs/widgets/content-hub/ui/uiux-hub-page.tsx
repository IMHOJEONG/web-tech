import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { getChannelHubDocs } from '~/widgets/content-hub/model/get-channel-hub-docs'
import type { SearchData } from '~/lib/get-search-data'

type UiUxDoc = SearchData & {
    title: string
    href: string
    summary: string
}

const FALLBACK_IMAGES = {
    featured: '/figma/article-detail/hero-abstract-technology.png',
    first: '/figma/article-detail/design-detail-1.png',
    second: '/figma/article-detail/design-detail-2.png',
    tutorial: '/figma/article-detail/mobile-interface-mockup.png',
}

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

function SmallArticleCard({
    eyebrow,
    doc,
    imageSrc,
}: {
    eyebrow: string
    doc: UiUxDoc
    imageSrc: string
}) {
    return (
        <Link
            href={doc.href}
            className="ds-card group flex h-full flex-col overflow-hidden bg-surface-container-lowest"
        >
            <div className="relative aspect-[16/9] overflow-hidden border-b border-outline-variant bg-surface-container-low">
                <Image
                    src={doc.thumbnail ?? imageSrc}
                    alt={doc.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
            </div>
            <div className="space-y-4 p-5">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-outline">
                    {eyebrow}
                </p>
                <h2 className="text-xl font-bold leading-tight tracking-[-0.03em] text-on-surface">
                    {doc.title}
                </h2>
                <p className="text-sm leading-6 text-on-surface-variant">
                    {doc.summary}
                </p>
            </div>
        </Link>
    )
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
        <main className="docs-shell px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <div className="space-y-10 lg:space-y-14">
                <section className="pl-5 md:pl-8">
                    <div className="max-w-5xl border-l-2 border-on-surface pl-5 md:pl-8">
                        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-outline">
                            {t('hero.eyebrow')}
                        </p>
                        <div className="mt-4 space-y-2">
                            <h1 className="font-display text-4xl leading-none font-bold tracking-[-0.05em] text-on-surface sm:text-5xl lg:text-6xl">
                                {t('hero.titleLineOne')}
                            </h1>
                            <p className="font-display text-4xl leading-none font-bold tracking-[-0.05em] text-outline sm:text-5xl lg:text-6xl">
                                {t('hero.titleLineTwo')}
                            </p>
                        </div>
                        <p className="mt-5 max-w-3xl text-sm leading-7 text-on-surface-variant sm:text-base">
                            {t('hero.description')}
                        </p>
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
                    <Link
                        href={featured.href}
                        className="group ds-card relative min-h-[32rem] overflow-hidden bg-zinc-950 text-zinc-50"
                    >
                        <div className="absolute inset-0">
                            <Image
                                src={
                                    featured.thumbnail ??
                                    FALLBACK_IMAGES.featured
                                }
                                alt={featured.title}
                                fill
                                className="object-cover opacity-45 transition-transform duration-700 group-hover:scale-[1.03]"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black via-black/70 to-black/10" />
                        </div>
                        <div className="relative flex h-full flex-col justify-end p-6 sm:p-8">
                            <div className="mb-5 flex flex-wrap items-center gap-2">
                                <span className="rounded-sm border border-white/20 bg-white/10 px-3 py-1 text-[0.6875rem] font-semibold tracking-[0.18em] text-white uppercase">
                                    {t('featured.primaryLabel')}
                                </span>
                                <span className="rounded-sm border border-white/20 px-3 py-1 text-[0.6875rem] font-semibold tracking-[0.18em] text-white/80 uppercase">
                                    {t('featured.secondaryLabel')}
                                </span>
                            </div>
                            <h2 className="max-w-[14ch] text-3xl font-bold leading-[1.02] tracking-[-0.05em] text-white sm:text-4xl">
                                {featured.title}
                            </h2>
                            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
                                {featured.summary}
                            </p>
                            <div className="mt-6 inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-white">
                                <span>{t('featured.action')}</span>
                                <span aria-hidden="true">↗</span>
                            </div>
                        </div>
                    </Link>

                    <div className="grid gap-6">
                        <SmallArticleCard
                            eyebrow={t('secondary.researchLabel')}
                            doc={secondaryOne}
                            imageSrc={FALLBACK_IMAGES.first}
                        />
                        <SmallArticleCard
                            eyebrow={t('secondary.guideLabel')}
                            doc={secondaryTwo}
                            imageSrc={FALLBACK_IMAGES.second}
                        />
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <Link
                        href={tutorial.href}
                        className="ds-card group relative min-h-[26rem] overflow-hidden bg-surface-container-lowest"
                    >
                        <div className="absolute inset-0">
                            <Image
                                src={
                                    tutorial.thumbnail ??
                                    FALLBACK_IMAGES.tutorial
                                }
                                alt={tutorial.title}
                                fill
                                className="object-cover opacity-65 transition-transform duration-700 group-hover:scale-[1.03]"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-white via-white/75 to-white/30" />
                        </div>
                        <div className="relative flex h-full flex-col justify-end p-6 sm:p-8">
                            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-outline">
                                {t('bottomLeft.label')}
                            </p>
                            <h2 className="mt-4 max-w-[15ch] text-3xl font-bold leading-[1.05] tracking-[-0.05em] text-on-surface">
                                {tutorial.title}
                            </h2>
                        </div>
                    </Link>

                    <section className="ds-card flex min-h-[26rem] flex-col justify-center bg-zinc-950 p-8 text-zinc-50 sm:p-10 lg:px-12">
                        <div className="mb-6 h-1 w-16 bg-primary" />
                        <h2
                            className={[
                                'w-full max-w-none whitespace-normal text-4xl font-bold text-white [overflow-wrap:normal] [word-break:keep-all]',
                                isKorean
                                    ? 'break-keep leading-[1.18] tracking-[-0.03em]'
                                    : 'leading-[1.04] tracking-[-0.04em]',
                            ].join(' ')}
                        >
                            {t('newsletter.title')}
                        </h2>
                        <p
                            className={[
                                'mt-5 w-full max-w-none whitespace-normal text-sm text-white/72 [overflow-wrap:normal] sm:text-base',
                                isKorean ? 'break-keep leading-7' : 'leading-7',
                            ].join(' ')}
                        >
                            {t('newsletter.description')}
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <input
                                className="min-h-14 flex-1 border border-white/12 bg-white/6 px-4 text-sm text-white placeholder:text-white/40"
                                placeholder={t('newsletter.placeholder')}
                            />
                            <button className="min-h-14 min-w-40 bg-white px-5 text-[0.72rem] font-semibold tracking-[0.2em] text-zinc-950 uppercase transition-opacity hover:opacity-90">
                                {t('newsletter.button')}
                            </button>
                        </div>
                    </section>
                </section>

                <section className="space-y-6">
                    <div className="grid gap-6 border-t border-outline-variant pt-8 md:grid-cols-3">
                        {moreArticles.map((doc) => (
                            <Link
                                key={doc.id}
                                href={doc.href}
                                className="group border-t-2 border-outline pt-5"
                            >
                                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-outline">
                                    {doc.date || t('more.fallbackDate')}
                                </p>
                                <h3 className="mt-4 text-2xl font-bold leading-tight tracking-[-0.04em] text-on-surface transition-colors group-hover:text-primary">
                                    {doc.title}
                                </h3>
                                <p className="mt-4 text-sm leading-6 text-on-surface-variant">
                                    {doc.summary}
                                </p>
                            </Link>
                        ))}
                    </div>
                    <div className="flex justify-center pt-2">
                        <Link
                            href="/feed?topic=uiux"
                            className="inline-flex min-h-16 items-center gap-3 border border-outline px-10 text-[0.72rem] font-semibold tracking-[0.24em] text-on-surface uppercase transition-colors hover:border-primary hover:text-primary"
                        >
                            <span>{t('loadMore')}</span>
                            <span aria-hidden="true">⌄</span>
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    )
}
