import Link from 'next/link'
import { ARTICLE_DETAIL_EDITORIAL_ASSETS } from '~/shared/assets/editorial'
import { ArticleDetailNewsletterCard } from '~/widgets/article-detail/ui/article-detail-newsletter-card'
import type { ArticleDetailMainProps } from '~/widgets/article-detail/ui/article-detail.types'

const imgAuthorProfile = ARTICLE_DETAIL_EDITORIAL_ASSETS.authorProfile
const imgAbstractTechnologyHero = ARTICLE_DETAIL_EDITORIAL_ASSETS.heroCover
const imgDesignDetail1 = ARTICLE_DETAIL_EDITORIAL_ASSETS.designDetail1
const imgDesignDetail2 = ARTICLE_DETAIL_EDITORIAL_ASSETS.designDetail2
const imgMobileInterfaceMockup =
    ARTICLE_DETAIL_EDITORIAL_ASSETS.mobileInterfaceMockup

export function ArticleDetailMain({
    badge,
    note,
    heroReadTime,
    heroTitle,
    heroAuthorAlt,
    heroAuthorName,
    heroAuthorMeta,
    heroImageAlt,
    bodyIntro,
    bodyParadoxTitle,
    bodyParadoxDescription,
    codeFileLabel,
    codeActionLabel,
    bodyStreamParagraph,
    bodyVisualTitle,
    bodyDesignAltOne,
    bodyDesignAltTwo,
    bodyMobileTitle,
    bodyMobileMockupAlt,
    bodyMobileParagraph,
    mobileNewsletter,
    authorAlt,
    authorTitle,
    authorDescription,
    authorLinks,
}: ArticleDetailMainProps) {
    return (
        <article className="min-w-0 space-y-10 lg:space-y-12">
            <section className="space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="ds-chip px-3 py-1 text-xs tracking-wider">
                        {badge}
                    </span>
                    <span className="text-on-surface-variant">•</span>
                    <span className="font-display text-xs tracking-wider text-outline uppercase">
                        {heroReadTime}
                    </span>
                </div>

                <div className="space-y-6">
                    <h1 className="font-display max-w-[15ch] text-[clamp(2.4rem,5vw,4rem)] leading-[1.15] font-bold tracking-[-0.03em] text-on-surface">
                        {heroTitle}
                    </h1>

                    <div className="flex items-center gap-4">
                        <div className="size-12 overflow-hidden rounded-xl border border-border bg-surface-container">
                            <img
                                src={imgAuthorProfile}
                                alt={heroAuthorAlt}
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div>
                            <p className="font-display text-base text-on-surface">
                                {heroAuthorName}
                            </p>
                            <p className="font-display text-sm tracking-[0.08em] text-outline uppercase">
                                {heroAuthorMeta}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-sm border border-border bg-surface-container-lowest">
                <div className="relative aspect-video">
                    <img
                        src={imgAbstractTechnologyHero}
                        alt={heroImageAlt}
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-background/70 to-transparent" />
                </div>
            </section>

            <section className="space-y-5 text-body-lg text-on-surface-variant lg:space-y-6">
                <p>{bodyIntro}</p>

                <div className="space-y-4 pt-4">
                    <h2 className="font-display text-headline-lg text-on-surface">
                        {bodyParadoxTitle}
                    </h2>
                    <p>{bodyParadoxDescription}</p>
                </div>
            </section>

            <section className="ds-code-shell">
                <div className="ds-code-shell__header">
                    <span className="tracking-[0.14em]">{codeFileLabel}</span>
                    <span className="font-mono text-xs text-outline">
                        {codeActionLabel}
                    </span>
                </div>
                <pre className="overflow-x-auto px-6 py-10 font-mono text-sm leading-normal text-on-surface">
                    <code>{`async function initializeNode(id: string) {
  // Initialize high-frequency stream
  const stream = await connectToRegistry(id);

  return stream.pipe(
    filter(data => data.priority > 0.8),
    map(transformData),
    tap(uiRegistry.update)
  );
}

// Precision observer hook
const useReactiveState = (stream$) => {
  const [state, setState] = useState([]);
  // Implementation details...
}`}</code>
                </pre>
            </section>

            <section className="space-y-5 text-body-lg text-on-surface-variant lg:space-y-6">
                <p>{bodyStreamParagraph}</p>

                <div className="space-y-4 pt-4">
                    <h2 className="font-display text-headline-lg text-on-surface">
                        {bodyVisualTitle}
                    </h2>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                    <div className="overflow-hidden rounded-sm border border-border bg-surface-container">
                        <img
                            src={imgDesignDetail1}
                            alt={bodyDesignAltOne}
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="overflow-hidden rounded-sm border border-border bg-surface-container">
                        <img
                            src={imgDesignDetail2}
                            alt={bodyDesignAltTwo}
                            className="h-full w-full object-cover"
                        />
                    </div>
                </div>

                <div className="space-y-4 pt-4">
                    <h2 className="font-display text-headline-lg text-on-surface">
                        {bodyMobileTitle}
                    </h2>
                </div>

                <div className="rounded-lg border border-border bg-surface-container-low p-6 sm:p-7 lg:p-8">
                    <div className="mx-auto max-w-[16rem] overflow-hidden rounded-[3rem] border-8 border-surface-container-highest bg-surface-container-lowest shadow-deep">
                        <div className="relative aspect-256/500">
                            <img
                                src={imgMobileInterfaceMockup}
                                alt={bodyMobileMockupAlt}
                                className="h-full w-full object-cover"
                            />
                            <div className="absolute left-1/2 top-0 h-6 w-24 -translate-x-1/2 rounded-b-2xl bg-zinc-900" />
                        </div>
                    </div>
                </div>

                <p>{bodyMobileParagraph}</p>
            </section>

            <section className="lg:hidden">
                <ArticleDetailNewsletterCard {...mobileNewsletter} />
            </section>

            <section className="border-t border-border pt-6 lg:pt-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="size-12 shrink-0 overflow-hidden rounded-full border border-border bg-surface-container">
                        <img
                            src={imgAuthorProfile}
                            alt={authorAlt}
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="space-y-2">
                        <p className="font-display text-sm text-on-surface">
                            {authorTitle}
                        </p>
                        <p className="max-w-2xl text-sm leading-6 text-on-surface-variant">
                            {authorDescription} {note}
                        </p>
                        <div className="flex flex-wrap gap-4 font-display text-xs tracking-[0.08em] uppercase">
                            <Link href="/about" className="text-primary">
                                {authorLinks.twitter}
                            </Link>
                            <Link href="/about" className="text-primary">
                                {authorLinks.github}
                            </Link>
                            <Link href="/about" className="text-primary">
                                {authorLinks.linkedin}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </article>
    )
}
