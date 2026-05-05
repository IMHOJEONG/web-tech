import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

const imgAuthorProfile = '/figma/article-detail/author-profile.png'
const imgAbstractTechnologyHero =
    '/figma/article-detail/hero-abstract-technology.png'
const imgDesignDetail1 = '/figma/article-detail/design-detail-1.png'
const imgDesignDetail2 = '/figma/article-detail/design-detail-2.png'
const imgMobileInterfaceMockup =
    '/figma/article-detail/mobile-interface-mockup.png'

type ArticleDetailProps = {
    channel: 'web' | 'mobile' | 'uiux'
}

function SidebarSection({
    title,
    children,
}: {
    title: string
    children: React.ReactNode
}) {
    return (
        <section className="space-y-4">
            <p className="font-display text-[0.625rem] leading-[0.9375rem] tracking-[0.2em] text-outline uppercase">
                {title}
            </p>
            {children}
        </section>
    )
}

function NewsletterCard({
    title,
    description,
    placeholder,
    buttonLabel,
    note,
    compact = false,
}: {
    title: string
    description: string
    placeholder: string
    buttonLabel: string
    note?: string
    compact?: boolean
}) {
    return (
        <div className="relative overflow-hidden rounded-sm border border-primary/20 bg-[#09090b] p-6">
            <div className="absolute -right-10 -top-10 size-24 rounded-full bg-primary/10 blur-2xl" />
            <div className="relative space-y-5">
                <div className="space-y-2">
                    <h3 className="font-display text-base text-zinc-100">
                        {title}
                    </h3>
                    <p className="text-sm leading-5 text-zinc-400">
                        {description}
                    </p>
                </div>

                {compact ? (
                    <div className="space-y-2">
                        <input
                            className="w-full border border-zinc-700 bg-surface-container px-3 py-3 text-sm tracking-[0.05em] text-zinc-300 uppercase outline-none transition-colors focus:border-primary"
                            placeholder={placeholder}
                        />
                        <button className="w-full bg-primary px-4 py-3 font-display text-sm tracking-[0.12em] text-primary-foreground uppercase transition-opacity hover:opacity-90">
                            {buttonLabel}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <input
                            className="w-full border border-zinc-700 bg-surface-container px-4 py-3 text-sm tracking-[0.05em] text-zinc-300 outline-none transition-colors focus:border-primary"
                            placeholder={placeholder}
                        />
                        <button className="w-full bg-primary px-4 py-3 font-display text-sm tracking-[0.12em] text-primary-foreground uppercase transition-opacity hover:opacity-90">
                            {buttonLabel}
                        </button>
                        {note ? (
                            <p className="text-center font-display text-[0.625rem] tracking-[0.16em] text-zinc-500 uppercase">
                                {note}
                            </p>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    )
}

export async function ArticleDetail({ channel }: ArticleDetailProps) {
    const t = await getTranslations('articleDetail')

    const meta = {
        badge: t(`channels.${channel}.badge`),
        note: t(`channels.${channel}.note`),
    }

    const tocItems = [
        t('toc.paradox'),
        t('toc.logic'),
        t('toc.visual'),
        t('toc.mobile'),
        t('toc.summary'),
    ]

    const relatedSignals = [
        {
            category: t('related.items.rust.category'),
            title: t('related.items.rust.title'),
            meta: t('related.items.rust.meta'),
            href: '/mobile',
        },
        {
            category: t('related.items.ethics.category'),
            title: t('related.items.ethics.title'),
            meta: t('related.items.ethics.meta'),
            href: '/ui-ux',
        },
        {
            category: t('related.items.transport.category'),
            title: t('related.items.transport.title'),
            meta: t('related.items.transport.meta'),
            href: '/web',
        },
    ]

    return (
        <main className="w-full text-on-surface">
            <div className="mx-auto h-0.5 max-w-page">
                <div className="h-full w-1/3 bg-primary shadow-[0_0_10px_rgba(0,220,229,0.5)]" />
            </div>

            <div className="mx-auto grid w-full max-w-page gap-8 px-4 pb-20 pt-32 sm:px-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <article className="min-w-0 space-y-12">
                    <section className="space-y-6">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-sm bg-secondary/15 px-3 py-1 font-display text-xs tracking-[0.05em] text-secondary uppercase">
                                {meta.badge}
                            </span>
                            <span className="text-on-surface-variant">•</span>
                            <span className="font-display text-xs tracking-[0.05em] text-outline uppercase">
                                {t('hero.readTime')}
                            </span>
                        </div>

                        <div className="space-y-6">
                            <h1 className="font-display max-w-[15ch] text-[clamp(2.4rem,5vw,4rem)] leading-[1.15] font-bold tracking-[-0.03em] text-on-surface">
                                {t('hero.title')}
                            </h1>

                            <div className="flex items-center gap-4">
                                <div className="size-12 overflow-hidden rounded-xl border border-border bg-surface-container">
                                    <img
                                        src={imgAuthorProfile}
                                        alt={t('hero.authorAlt')}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div>
                                    <p className="font-display text-base text-on-surface">
                                        {t('hero.authorName')}
                                    </p>
                                    <p className="font-display text-sm tracking-[0.08em] text-outline uppercase">
                                        {t('hero.authorMeta')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-sm border border-border bg-surface-container-lowest">
                        <div className="relative aspect-[16/9]">
                            <img
                                src={imgAbstractTechnologyHero}
                                alt={t('hero.heroImageAlt')}
                                className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
                        </div>
                    </section>

                    <section className="space-y-6 text-body-lg text-on-surface-variant">
                        <p>{t('body.intro')}</p>

                        <div className="space-y-4 pt-4">
                            <h2 className="font-display text-headline-lg text-on-surface">
                                {t('body.sections.paradox.title')}
                            </h2>
                            <p>{t('body.sections.paradox.description')}</p>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-sm border border-white/10 bg-black">
                        <div className="flex items-center justify-between border-b border-white/5 bg-surface-container px-3 py-1.5">
                            <span className="font-display text-[0.625rem] tracking-[0.14em] text-outline uppercase">
                                {t('code.fileLabel')}
                            </span>
                            <span className="font-mono text-xs text-outline">
                                {t('code.actionLabel')}
                            </span>
                        </div>
                        <pre className="overflow-x-auto px-6 py-10 font-mono text-sm leading-[1.5] text-zinc-200">
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

                    <section className="space-y-6 text-body-lg text-on-surface-variant">
                        <p>{t('body.streamParagraph')}</p>

                        <div className="space-y-4 pt-4">
                            <h2 className="font-display text-headline-lg text-on-surface">
                                {t('body.sections.visual.title')}
                            </h2>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                            <div className="overflow-hidden rounded-sm border border-border bg-surface-container">
                                <img
                                    src={imgDesignDetail1}
                                    alt={t('body.designAltOne')}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div className="overflow-hidden rounded-sm border border-border bg-surface-container">
                                <img
                                    src={imgDesignDetail2}
                                    alt={t('body.designAltTwo')}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <h2 className="font-display text-headline-lg text-on-surface">
                                {t('body.sections.mobile.title')}
                            </h2>
                        </div>

                        <div className="rounded-lg border border-border bg-surface-container-low p-8">
                            <div className="mx-auto max-w-[16rem] overflow-hidden rounded-[3rem] border-8 border-zinc-900 bg-black shadow-deep">
                                <div className="relative aspect-[256/500]">
                                    <img
                                        src={imgMobileInterfaceMockup}
                                        alt={t('body.mobileMockupAlt')}
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute left-1/2 top-0 h-6 w-24 -translate-x-1/2 rounded-b-2xl bg-zinc-900" />
                                </div>
                            </div>
                        </div>

                        <p>{t('body.mobileParagraph')}</p>
                    </section>

                    <section className="lg:hidden">
                        <NewsletterCard
                            title={t('newsletter.mobile.title')}
                            description={t('newsletter.mobile.description')}
                            placeholder={t('newsletter.mobile.placeholder')}
                            buttonLabel={t('newsletter.mobile.button')}
                            note={t('newsletter.mobile.note')}
                        />
                    </section>

                    <section className="border-t border-border pt-8">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                            <div className="size-12 shrink-0 overflow-hidden rounded-full border border-border bg-surface-container">
                                <img
                                    src={imgAuthorProfile}
                                    alt={t('author.alt')}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div className="space-y-2">
                                <p className="font-display text-sm text-on-surface">
                                    {t('author.title')}
                                </p>
                                <p className="max-w-2xl text-sm leading-6 text-on-surface-variant">
                                    {t('author.description')} {meta.note}
                                </p>
                                <div className="flex flex-wrap gap-4 font-display text-xs tracking-[0.08em] uppercase">
                                    <Link
                                        href="/about"
                                        className="text-primary"
                                    >
                                        {t('author.links.twitter')}
                                    </Link>
                                    <Link
                                        href="/about"
                                        className="text-primary"
                                    >
                                        {t('author.links.github')}
                                    </Link>
                                    <Link
                                        href="/about"
                                        className="text-primary"
                                    >
                                        {t('author.links.linkedin')}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                </article>

                <aside className="hidden space-y-8 lg:sticky lg:top-28 lg:block lg:self-start">
                    <SidebarSection title={t('sidebar.tocTitle')}>
                        <div className="space-y-3">
                            {tocItems.map((item, index) => (
                                <div
                                    key={item}
                                    className={
                                        index === 0
                                            ? 'font-display text-base text-primary'
                                            : 'font-display text-base text-outline'
                                    }
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                    </SidebarSection>

                    <SidebarSection title={t('sidebar.joinTitle')}>
                        <NewsletterCard
                            compact
                            title={t('newsletter.sidebar.title')}
                            description={t('newsletter.sidebar.description')}
                            placeholder={t('newsletter.sidebar.placeholder')}
                            buttonLabel={t('newsletter.sidebar.button')}
                        />
                    </SidebarSection>

                    <SidebarSection title={t('related.title')}>
                        <div className="space-y-2">
                            {relatedSignals.map((signal) => (
                                <Link
                                    key={signal.title}
                                    href={signal.href}
                                    className="block rounded-sm px-2 py-2 transition-colors hover:bg-surface-container-low"
                                >
                                    <div className="inline-flex rounded-sm bg-surface-container px-1.5 py-0.5 font-display text-[0.625rem] tracking-[0.08em] text-on-surface-variant uppercase">
                                        {signal.category}
                                    </div>
                                    <h3 className="mt-2 font-display text-base leading-[1.4] text-on-surface">
                                        {signal.title}
                                    </h3>
                                    <p className="mt-1 font-display text-[0.625rem] tracking-[0.1em] text-outline uppercase">
                                        {signal.meta}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </SidebarSection>
                </aside>
            </div>
        </main>
    )
}
