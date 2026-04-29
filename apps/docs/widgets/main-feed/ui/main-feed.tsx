import { cn } from '@web-tech/ui/lib/utils'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from '~/lib/get-document'

type FeedDoc = Partial<Metadata> & {
    title: string
    slug: string
    summary: string
    date: string
}

type TopicTone = {
    label: string
    badgeClassName: string
    textClassName: string
}

type FeedAuthor = {
    name: string
    role: string
}

const AUTHOR_PALETTE = [
    { name: 'Alex Rivers', role: 'Sr. Architect' },
    { name: 'Sarah Chen', role: 'Web Engineer' },
    { name: 'Mina Park', role: 'Product Designer' },
    { name: 'John Doe', role: 'Mobile Engineer' },
] satisfies FeedAuthor[]

const WEB_TOPIC: TopicTone = {
    label: 'WEB',
    badgeClassName: 'bg-cyan-400/10 border border-cyan-400/20 text-cyan-300',
    textClassName: 'text-cyan-400',
}

const UIUX_TOPIC: TopicTone = {
    label: 'UI/UX',
    badgeClassName: 'bg-secondary/15 border border-secondary/20 text-secondary',
    textClassName: 'text-secondary',
}

const ARCHITECTURE_TOPIC: TopicTone = {
    label: 'ARCHITECTURE',
    badgeClassName:
        'bg-violet-400/10 border border-violet-300/15 text-violet-200',
    textClassName: 'text-violet-300',
}

const SYSTEMS_TOPIC: TopicTone = {
    label: 'SYSTEMS',
    badgeClassName: 'bg-amber-300/10 border border-amber-200/15 text-amber-100',
    textClassName: 'text-amber-200',
}

const GENERAL_TOPIC: TopicTone = {
    label: 'ENGINEERING',
    badgeClassName:
        'bg-surface-container border border-outline-variant text-on-surface-variant',
    textClassName: 'text-on-surface-variant',
}

const CATEGORY_FILTERS = ['ALL', 'WEB', 'MOBILE', 'UI/UX']

const PLACEHOLDER_MOBILE = {
    title: 'Mobile notes are lining up for the next drop.',
    summary:
        'Platform-specific interaction patterns, performance constraints, and device-aware product thinking are being assembled now.',
    topic: GENERAL_TOPIC,
    metric: 'ROADMAP',
}

const PLACEHOLDER_UI = {
    title: 'Typography as Interface: Designing for Readability',
    summary:
        'When content is the UI, every pixel of kerning and leading shapes how technical ideas land.',
    topic: UIUX_TOPIC,
    metric: '+12 CONTRIBUTORS',
}

function isFeedDoc(doc: Partial<Metadata>): doc is FeedDoc {
    return Boolean(doc.title && doc.slug && doc.summary && doc.date)
}

function estimateReadMinutes(content?: string) {
    const source = content?.trim() ?? ''
    if (!source) {
        return 5
    }

    return Math.max(5, Math.ceil(source.length / 420))
}

function getTopicStyle(doc: FeedDoc): TopicTone {
    const fileName = doc.fileName ?? ''

    if (
        fileName.includes('/category/fe/') ||
        fileName.includes('/data/v8/')
    ) {
        return WEB_TOPIC
    }

    if (fileName.includes('/data/shadcn/')) {
        return UIUX_TOPIC
    }

    if (fileName.includes('/category/computer-science/')) {
        return SYSTEMS_TOPIC
    }

    if (fileName.includes('/category/be/')) {
        return ARCHITECTURE_TOPIC
    }

    return GENERAL_TOPIC
}

function getAuthor(doc: FeedDoc, index: number): FeedAuthor {
    const seededIndex = (doc.slug.length + index) % AUTHOR_PALETTE.length
    return AUTHOR_PALETTE[seededIndex] ?? AUTHOR_PALETTE[0]!
}

function FeedBadge({
    label,
    className,
}: {
    label: string
    className: string
}) {
    return (
        <div
            className={cn(
                'font-display inline-flex items-center gap-2 rounded-[0.125rem] px-3 py-1 text-[0.625rem] tracking-[0.2em] uppercase',
                className
            )}
        >
            <span className="inline-block size-1.5 rounded-full bg-current" />
            <span>{label}</span>
        </div>
    )
}

function FeaturedCard({
    doc,
    index,
}: {
    doc: FeedDoc
    index: number
}) {
    const topic = getTopicStyle(doc)
    const minutes = estimateReadMinutes(doc.content)
    const author = getAuthor(doc, index)

    return (
        <Link
            href={`/docs/${doc.slug}`}
            className="group ds-card col-span-12 grid overflow-hidden bg-surface-container-low lg:col-span-8 lg:grid-cols-2"
        >
            <div className="flex flex-col justify-between p-8">
                <div className="space-y-4">
                    <FeedBadge
                        label={`${topic.label} DEVELOPMENT`}
                        className={topic.badgeClassName}
                    />
                    <h3 className="font-display text-[1.75rem] leading-[1.25] font-bold tracking-[-0.03em] text-on-surface">
                        {doc.title}
                    </h3>
                    <p className="max-w-sm text-body-md text-on-surface-variant">
                        {doc.summary}
                    </p>
                </div>

                <div className="mt-8 flex items-center gap-4 text-[0.75rem] uppercase tracking-[0.08em] text-on-surface-variant">
                    <span>{minutes} MIN READ</span>
                    <span className="size-1 rounded-full bg-white/20" />
                    <span>BY {author.name}</span>
                </div>
            </div>

            <div className="relative min-h-[18rem] overflow-hidden">
                <Image
                    src={doc.thumbnail ?? '/default/no-image.webp'}
                    alt={doc.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(17,19,25,0.12),rgba(17,19,25,0.48))]" />
            </div>
        </Link>
    )
}

function CompactCard({
    doc,
    index,
}: {
    doc: FeedDoc
    index: number
}) {
    const topic = getTopicStyle(doc)
    const minutes = estimateReadMinutes(doc.content)

    return (
        <Link
            href={`/docs/${doc.slug}`}
            className="group ds-card col-span-12 flex h-full flex-col justify-between bg-surface-container-low p-8 lg:col-span-4"
        >
            <div className="space-y-4">
                <FeedBadge label={topic.label} className={topic.badgeClassName} />
                <h3 className="font-display text-headline-md text-on-surface">
                    {doc.title}
                </h3>
                <p className="text-body-md text-on-surface-variant">
                    {doc.summary}
                </p>
            </div>

            <div className="mt-8 flex items-center justify-between">
                <span className="text-[0.75rem] uppercase tracking-[0.08em] text-on-surface-variant">
                    {minutes} MIN READ
                </span>
                <span className="rounded-full border border-white/10 p-2 text-on-surface-variant transition-colors group-hover:text-on-surface">
                    <ArrowUpRight className="size-4" />
                </span>
            </div>
        </Link>
    )
}

function ImageCard({
    doc,
    index,
}: {
    doc: FeedDoc
    index: number
}) {
    const topic = getTopicStyle(doc)
    const minutes = estimateReadMinutes(doc.content)
    const author = getAuthor(doc, index)

    return (
        <Link
            href={`/docs/${doc.slug}`}
            className="group ds-card col-span-12 flex h-full flex-col overflow-hidden bg-surface-container-low lg:col-span-4"
        >
            <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                <Image
                    src={doc.thumbnail ?? '/default/no-image.webp'}
                    alt={doc.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    sizes="(max-width: 1024px) 100vw, 30vw"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,19,25,0.12),rgba(17,19,25,0.4))]" />
            </div>

            <div className="flex flex-1 flex-col gap-4 p-8">
                <FeedBadge label={topic.label} className={topic.badgeClassName} />
                <h3 className="font-display text-headline-md text-on-surface">
                    {doc.title}
                </h3>
                <p className="flex-1 text-body-md text-on-surface-variant">
                    {doc.summary}
                </p>

                <div className="flex items-center gap-3 pt-4 text-[0.75rem] uppercase tracking-[0.08em] text-on-surface-variant">
                    <span className="inline-flex size-8 items-center justify-center rounded-full border border-white/10 bg-surface-container">
                        {author.name.charAt(0)}
                    </span>
                    <span>{author.name}</span>
                    <span className="size-1 rounded-full bg-white/20" />
                    <span>{minutes} MIN READ</span>
                </div>
            </div>
        </Link>
    )
}

function TextSupportCard({
    title,
    summary,
    topic,
    footer,
}: {
    title: string
    summary: string
    topic: TopicTone
    footer: React.ReactNode
}) {
    return (
        <article className="ds-card col-span-12 flex h-full flex-col justify-between bg-surface-container-low p-8 lg:col-span-4">
            <div className="space-y-4">
                <FeedBadge label={topic.label} className={topic.badgeClassName} />
                <h3 className="font-display text-headline-md text-on-surface">
                    {title}
                </h3>
                <p className="text-body-md text-on-surface-variant">{summary}</p>
            </div>

            <div className="mt-8">{footer}</div>
        </article>
    )
}

export function MainFeed({ docs }: { docs: Partial<Metadata>[] }) {
    const feedDocs = docs.filter(isFeedDoc)
    const [heroDoc, featuredDoc, compactDoc, imageDoc, supportDoc] = feedDocs

    if (!heroDoc) {
        return null
    }

    const heroTopic = getTopicStyle(heroDoc)
    const heroAuthor = getAuthor(heroDoc, 0)
    const heroMinutes = estimateReadMinutes(heroDoc.content)

    return (
        <main className="w-full bg-[linear-gradient(180deg,var(--background)_0%,var(--surface-container-lowest)_100%)] text-on-surface">
            <section className="border-b border-white/5 bg-surface-container-lowest px-4 pb-20 pt-20 sm:px-8">
                <div className="mx-auto grid max-w-page gap-12 lg:grid-cols-12 lg:items-center">
                    <div className="space-y-6 lg:col-span-7">
                        <FeedBadge
                            label="TRENDING NOW"
                            className="bg-secondary/15 text-secondary"
                        />

                        <div className="space-y-5">
                            <div className="max-w-[42rem]">
                                <span
                                    className={cn(
                                        'font-display block text-headline-xl text-on-surface',
                                        heroTopic.textClassName
                                    )}
                                >
                                    {heroTopic.label}
                                </span>
                                <h1 className="font-display text-[clamp(2.5rem,5vw,4rem)] leading-[1.08] font-bold tracking-[-0.04em] text-on-surface">
                                    {heroDoc.title}
                                </h1>
                            </div>

                            <p className="max-w-2xl text-body-lg text-on-surface-variant">
                                {heroDoc.summary}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 pt-2 text-sm text-on-surface-variant">
                            <div className="flex items-center gap-3">
                                <span className="inline-flex size-10 items-center justify-center rounded-full border border-white/10 bg-surface-container text-cyan-400">
                                    {heroAuthor.name.charAt(0)}
                                </span>
                                <div className="space-y-0.5">
                                    <p className="font-display text-base text-on-surface">
                                        {heroAuthor.name}
                                    </p>
                                    <p className="text-xs uppercase tracking-[0.08em] text-on-surface-variant">
                                        {heroAuthor.role}
                                    </p>
                                </div>
                            </div>

                            <div className="h-8 w-px bg-white/10" />

                            <div className="space-y-0.5">
                                <p className="font-display text-base text-on-surface">
                                    {heroMinutes} MIN READ
                                </p>
                                <p className="text-xs uppercase tracking-[0.08em] text-on-surface-variant">
                                    {heroTopic.label}
                                </p>
                            </div>
                        </div>

                        <Link
                            href={`/docs/${heroDoc.slug}`}
                            className="ds-button-primary inline-flex"
                        >
                            READ ARTICLE
                        </Link>
                    </div>

                    <div className="relative lg:col-span-5">
                        <div className="absolute -left-8 bottom-0 size-40 rounded-full bg-secondary/10 blur-3xl" />
                        <div className="absolute -right-8 top-0 size-48 rounded-full bg-cyan-400/10 blur-3xl" />
                        <div className="relative overflow-hidden rounded-sm border border-white/10 bg-[#0c0e14] p-4 shadow-[0_0_20px_rgba(0,220,229,0.15)]">
                            <div className="relative aspect-[1/1.02] overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))]">
                                <div className="absolute inset-[12%] border border-white/10" />
                                <div className="absolute inset-[20%] border border-white/10" />
                                <div className="absolute inset-[28%] border border-white/10" />
                                <div className="absolute inset-[36%] border border-cyan-400/20 shadow-[0_0_30px_rgba(0,220,229,0.12)]" />
                                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.03),transparent_40%,rgba(255,255,255,0.02))]" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="px-4 py-16 sm:px-8">
                <div className="mx-auto max-w-page space-y-12">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <span className="h-8 w-2 bg-primary" />
                                <h2 className="font-display text-headline-lg text-on-surface">
                                    Latest Technical Insights
                                </h2>
                            </div>
                            <p className="font-body text-sm tracking-[0.16em] uppercase text-on-surface-variant">
                                Precision curated knowledge
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {CATEGORY_FILTERS.map((filter, index) => (
                                <button
                                    key={filter}
                                    type="button"
                                    className={cn(
                                        'font-display border px-[1.0625rem] py-[0.5625rem] text-sm transition-colors',
                                        index === 0
                                            ? 'border-white/10 bg-surface-container text-cyan-400'
                                            : 'border-white/5 bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                                    )}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-6">
                        {featuredDoc && <FeaturedCard doc={featuredDoc} index={1} />}
                        {compactDoc && <CompactCard doc={compactDoc} index={2} />}
                        {imageDoc ? (
                            <ImageCard doc={imageDoc} index={3} />
                        ) : (
                            <TextSupportCard
                                title={PLACEHOLDER_MOBILE.title}
                                summary={PLACEHOLDER_MOBILE.summary}
                                topic={PLACEHOLDER_MOBILE.topic}
                                footer={
                                    <div className="text-[0.75rem] uppercase tracking-[0.08em] text-on-surface-variant">
                                        {PLACEHOLDER_MOBILE.metric}
                                    </div>
                                }
                            />
                        )}

                        {supportDoc ? (
                            <CompactCard doc={supportDoc} index={4} />
                        ) : (
                            <TextSupportCard
                                title={PLACEHOLDER_UI.title}
                                summary={PLACEHOLDER_UI.summary}
                                topic={PLACEHOLDER_UI.topic}
                                footer={
                                    <div className="flex items-center gap-3 text-[0.75rem] uppercase tracking-[0.08em] text-on-surface-variant">
                                        <span className="inline-flex size-8 items-center justify-center rounded-full border border-white/10 bg-surface-container">
                                            +
                                        </span>
                                        <span>{PLACEHOLDER_UI.metric}</span>
                                    </div>
                                }
                            />
                        )}
                    </div>

                    <div className="flex justify-center pt-4">
                        <Link
                            href="/feed"
                            className="font-display inline-flex items-center gap-4 border border-white/10 px-12 py-4 text-base text-on-surface transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
                        >
                            LOAD MORE SEQUENCES
                            <ArrowRight className="size-4" />
                        </Link>
                    </div>
                </div>
            </section>

            <section className="px-4 pb-20 sm:px-8">
                <div className="mx-auto max-w-page">
                    <div className="relative overflow-hidden border border-white/5 bg-surface-container p-8 sm:p-12">
                        <div className="absolute right-0 top-0 h-40 w-56 bg-[linear-gradient(135deg,transparent_25%,rgba(255,255,255,0.04)_25%,rgba(255,255,255,0.04)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.03)_75%)] opacity-70" />

                        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
                            <div className="space-y-3">
                                <h2 className="font-display text-headline-lg text-on-surface">
                                    Join the Logic
                                </h2>
                                <p className="max-w-xl text-body-md text-on-surface-variant">
                                    Get precision-engineered technical insights
                                    delivered to your terminal every Monday
                                    morning.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <div className="flex min-h-12 flex-1 items-center border border-white/10 bg-background px-6">
                                    <span className="font-mono text-sm uppercase tracking-[0.08em] text-zinc-500">
                                        user@terminal.io
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className="ds-button-primary justify-center"
                                >
                                    SUBSCRIBE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
