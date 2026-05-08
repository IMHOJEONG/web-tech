import { cn } from '@web-tech/ui/lib/utils'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from '~/lib/get-document'
import { getDocChannel } from '~/lib/get-doc-channel'
import { getDocHref } from '~/lib/get-doc-route'
import { normalizeDocPath } from '~/lib/normalize-doc-path'

export type FeedFilter = 'all' | 'web' | 'mobile' | 'uiux'

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
    { name: 'coder', role: 'Web Engineer' },
] satisfies FeedAuthor[]

const WEB_TOPIC: TopicTone = {
    label: 'WEB',
    badgeClassName: 'bg-primary/10 border border-primary/20 text-primary',
    textClassName: 'text-primary',
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

const CATEGORY_FILTERS: Array<{
    key: FeedFilter
    label: string
}> = [
    { key: 'all', label: 'ALL' },
    { key: 'web', label: 'WEB' },
    { key: 'mobile', label: 'MOBILE' },
    { key: 'uiux', label: 'UI/UX' },
]

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

function stripMarkup(text: string) {
    return text
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

function getFeedSummary(doc: Partial<Metadata>) {
    const summary = doc.summary?.trim()

    if (summary) {
        return summary
    }

    const content = stripMarkup(doc.content ?? '')

    if (content) {
        return content.slice(0, 160)
    }

    return 'Open the article to read the latest draft.'
}

function toFeedDoc(doc: Partial<Metadata>): FeedDoc | null {
    const title = doc.title?.trim()
    const slug = doc.slug?.trim()

    if (!title || !slug) {
        return null
    }

    return {
        ...doc,
        title,
        slug,
        summary: getFeedSummary(doc),
        date: doc.date?.trim() ?? '',
    }
}

function estimateReadMinutes(content?: string) {
    const source = content?.trim() ?? ''
    if (!source) {
        return 5
    }

    return Math.max(5, Math.ceil(source.length / 420))
}

function getReadMinutes(doc: FeedDoc) {
    if (typeof doc.readMinutes === 'number' && doc.readMinutes > 0) {
        return doc.readMinutes
    }

    return estimateReadMinutes(doc.content)
}

function getTextLang(text: string) {
    return /[가-힣]/.test(text) ? 'ko' : 'en'
}

function getTopicStyle(doc: FeedDoc): TopicTone {
    const fileName = normalizeDocPath(doc.fileName ?? '')
    const inferredTone = (() => {
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
    })()

    if (doc.topicLabel?.trim()) {
        return {
            ...inferredTone,
            label: doc.topicLabel.trim(),
        }
    }

    return inferredTone
}

function getFeedFilter(doc: FeedDoc): FeedFilter {
    const channel = getDocChannel(doc.fileName)

    return channel === 'other' ? 'web' : channel
}

function getFilterHref(filter: FeedFilter) {
    return filter === 'all' ? '/feed' : `/feed?topic=${filter}`
}

export function normalizeFeedFilter(value?: string): FeedFilter {
    if (value === 'web' || value === 'mobile' || value === 'uiux') {
        return value
    }

    return 'all'
}

function getAuthor(doc: FeedDoc, index: number): FeedAuthor {
    if (doc.authorName?.trim()) {
        return {
            name: doc.authorName.trim(),
            role: doc.authorRole?.trim() || 'Contributor',
        }
    }

    const seededIndex = (doc.slug.length + index) % AUTHOR_PALETTE.length
    return AUTHOR_PALETTE[seededIndex] ?? AUTHOR_PALETTE[0]!
}

function FeedBadge({ label, className }: { label: string; className: string }) {
    return (
        <div
            className={cn(
                'font-display inline-flex items-center gap-2 rounded-xs px-3 py-1 text-[0.625rem] tracking-[0.2em] uppercase',
                className
            )}
        >
            <span className="inline-block size-1.5 rounded-full bg-current" />
            <span>{label}</span>
        </div>
    )
}

function FeaturedCard({ doc, index }: { doc: FeedDoc; index: number }) {
    const topic = getTopicStyle(doc)
    const minutes = getReadMinutes(doc)
    const author = getAuthor(doc, index)

    return (
        <Link
            href={getDocHref(doc)}
            className="group ds-card col-span-12 grid w-full min-w-0 overflow-hidden bg-surface-container-low lg:col-span-8 lg:grid-cols-2"
        >
            <div className="flex w-full min-w-0 self-stretch flex-col justify-between p-6 sm:p-7 lg:p-8">
                <div className="w-full min-w-0 self-stretch space-y-4">
                    <FeedBadge
                        label={`${topic.label} DEVELOPMENT`}
                        className={topic.badgeClassName}
                    />
                    <h3 className="font-display text-[1.75rem] leading-tight font-bold tracking-[-0.03em] text-on-surface">
                        {doc.title}
                    </h3>
                    <p
                        lang={getTextLang(doc.summary)}
                        className="block w-full max-w-none self-stretch break-keep whitespace-normal text-body-md text-on-surface-variant"
                    >
                        {doc.summary}
                    </p>
                </div>

                <div className="mt-8 flex items-center gap-4 text-[0.75rem] uppercase tracking-[0.08em] text-on-surface-variant">
                    <span>{minutes} MIN READ</span>
                    <span className="size-1 rounded-full bg-outline-variant" />
                    <span>BY {author.name}</span>
                </div>
            </div>

            <div className="relative min-h-72 overflow-hidden">
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

function CompactCard({ doc, index }: { doc: FeedDoc; index: number }) {
    const topic = getTopicStyle(doc)
    const minutes = getReadMinutes(doc)

    return (
        <Link
            href={getDocHref(doc)}
            className="group ds-card col-span-12 flex h-full w-full min-w-0 flex-col justify-between bg-surface-container-low p-6 sm:p-7 lg:col-span-4 lg:p-8"
        >
            <div className="w-full min-w-0 self-stretch space-y-4">
                <FeedBadge
                    label={topic.label}
                    className={topic.badgeClassName}
                />
                <h3 className="font-display text-[1.4rem] leading-[1.18] tracking-[-0.03em] text-on-surface">
                    {doc.title}
                </h3>
                <p
                    lang={getTextLang(doc.summary)}
                    className="block w-full max-w-none self-stretch break-keep whitespace-normal text-body-md text-on-surface-variant"
                >
                    {doc.summary}
                </p>
            </div>

            <div className="mt-8 flex items-center justify-between">
                <span className="text-[0.75rem] uppercase tracking-[0.08em] text-on-surface-variant">
                    {minutes} MIN READ
                </span>
                <span className="ds-focus-ring rounded-full border border-outline-variant bg-surface-container-low p-2 text-on-surface-variant transition-colors group-hover:text-on-surface">
                    <ArrowUpRight className="size-4" />
                </span>
            </div>
        </Link>
    )
}

function ImageCard({ doc, index }: { doc: FeedDoc; index: number }) {
    const topic = getTopicStyle(doc)
    const minutes = getReadMinutes(doc)
    const author = getAuthor(doc, index)

    return (
        <Link
            href={getDocHref(doc)}
            className="group ds-card col-span-12 flex h-full w-full min-w-0 flex-col overflow-hidden bg-surface-container-low lg:col-span-4"
        >
            <div className="relative aspect-4/3 overflow-hidden bg-surface">
                <Image
                    src={doc.thumbnail ?? '/default/no-image.webp'}
                    alt={doc.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    sizes="(max-width: 1024px) 100vw, 30vw"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,19,25,0.12),rgba(17,19,25,0.4))]" />
            </div>

            <div className="flex w-full min-w-0 flex-1 self-stretch flex-col gap-4 p-6 sm:p-7 lg:p-8">
                <FeedBadge
                    label={topic.label}
                    className={topic.badgeClassName}
                />
                <h3 className="font-display text-[1.4rem] leading-[1.18] tracking-[-0.03em] text-on-surface">
                    {doc.title}
                </h3>
                <p
                    lang={getTextLang(doc.summary)}
                    className="block w-full max-w-none self-stretch break-keep whitespace-normal text-body-md text-on-surface-variant"
                >
                    {doc.summary}
                </p>

                <div className="flex items-center gap-3 pt-4 text-[0.75rem] uppercase tracking-[0.08em] text-on-surface-variant">
                    <span className="inline-flex size-8 items-center justify-center rounded-full border border-outline-variant bg-surface-container-low">
                        {author.name.charAt(0)}
                    </span>
                    <span>{author.name}</span>
                    <span className="size-1 rounded-full bg-outline-variant" />
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
        <article className="ds-card col-span-12 flex h-full w-full min-w-0 flex-col justify-between bg-surface-container-low p-6 sm:p-7 lg:col-span-4 lg:p-8">
            <div className="w-full min-w-0 self-stretch space-y-4">
                <FeedBadge
                    label={topic.label}
                    className={topic.badgeClassName}
                />
                <h3 className="font-display text-[1.4rem] leading-[1.18] tracking-[-0.03em] text-on-surface">
                    {title}
                </h3>
                <p
                    lang={getTextLang(summary)}
                    className="block w-full max-w-none self-stretch break-keep whitespace-normal text-body-md text-on-surface-variant"
                >
                    {summary}
                </p>
            </div>

            <div className="mt-8">{footer}</div>
        </article>
    )
}

function NewsletterInjectionCard() {
    return null
}

function EmptyFilteredFeed({ activeFilter }: { activeFilter: FeedFilter }) {
    return (
        <article className="ds-card col-span-12 flex min-h-80 flex-col justify-between bg-surface-container-low p-6 sm:p-7 lg:p-8">
            <div className="space-y-4">
                <FeedBadge
                    label={
                        activeFilter === 'mobile'
                            ? 'MOBILE FILTER'
                            : activeFilter === 'uiux'
                              ? 'UI/UX FILTER'
                              : 'WEB FILTER'
                    }
                    className="bg-surface-container border border-outline-variant text-on-surface-variant"
                />
                <h3 className="font-display text-[1.4rem] leading-[1.18] tracking-[-0.03em] text-on-surface">
                    아직 이 필터에 맞는 큐레이션 문서가 충분하지 않습니다.
                </h3>
                <p className="max-w-xl text-body-md text-on-surface-variant">
                    현재는 전체 피드에서 더 많은 문서를 볼 수 있고, 이후 모바일
                    및 세부 트랙 문서를 계속 확장할 예정입니다.
                </p>
            </div>

            <div className="flex flex-wrap gap-3">
                <Link
                    href="/feed"
                    className="ds-outline-button gap-3 px-5 py-3 text-sm"
                >
                    전체 피드 보기
                </Link>
                <Link
                    href="/docs"
                    className="ds-button-secondary gap-3 px-5 py-3 text-sm"
                >
                    전체 문서 인덱스
                </Link>
            </div>
        </article>
    )
}

export function MainFeed({
    docs,
    activeFilter = 'all',
}: {
    docs: Partial<Metadata>[]
    activeFilter?: FeedFilter
}) {
    const feedDocs = docs
        .map((doc) => toFeedDoc(doc))
        .filter((doc): doc is FeedDoc => doc !== null)
    const filteredFeedDocs =
        activeFilter === 'all'
            ? feedDocs
            : feedDocs.filter((doc) => getFeedFilter(doc) === activeFilter)

    const [heroDoc, featuredDoc, compactDoc, imageDoc, supportDoc] =
        filteredFeedDocs

    if (!heroDoc) {
        return (
            <main className="w-full bg-[linear-gradient(180deg,var(--background)_0%,var(--surface-container-lowest)_100%)] text-on-surface">
                <section className="border-b border-outline-variant bg-surface-container-lowest px-4 pb-16 pt-16 sm:px-6 md:px-8 lg:pb-20 lg:pt-20">
                    <div className="mx-auto max-w-page space-y-6">
                        <FeedBadge
                            label="FILTERED FEED"
                            className="bg-secondary/15 text-secondary"
                        />
                        <div className="space-y-3">
                            <h1 className="font-display text-[clamp(1.9rem,3.4vw,2.9rem)] leading-[1.1] font-bold tracking-[-0.04em] text-on-surface">
                                선택한 트랙을 기준으로 피드를 좁혀보고 있습니다.
                            </h1>
                            <p className="max-w-2xl text-body-lg text-on-surface-variant">
                                `topic` query string 기반으로 큐레이션 피드를
                                필터링하고 있습니다. 아직 이 조건에 맞는 문서는
                                많지 않아서, 전체 피드나 문서 인덱스로 이동하는
                                흐름을 함께 제공합니다.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="px-4 py-12 sm:px-6 md:px-8 lg:py-16">
                    <div className="mx-auto max-w-page space-y-10 lg:space-y-12">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="h-8 w-2 bg-primary" />
                                    <h2 className="font-display text-[1.9rem] leading-[1.08] tracking-[-0.04em] text-on-surface">
                                        Latest Technical Insights
                                    </h2>
                                </div>
                                <p className="font-body text-sm tracking-[0.16em] uppercase text-on-surface-variant">
                                    Precision curated knowledge
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                {CATEGORY_FILTERS.map((filter) => {
                                    return (
                                        <Link
                                            key={filter.key}
                                            href={getFilterHref(filter.key)}
                                            className={cn(
                                                'ds-outline-button px-4.25 py-2.25 text-sm',
                                                activeFilter === filter.key
                                                    ? 'border-primary bg-surface-container text-primary shadow-glow-primary'
                                                    : 'text-on-surface-variant hover:text-on-surface'
                                            )}
                                        >
                                            {filter.label}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-6">
                            <EmptyFilteredFeed activeFilter={activeFilter} />
                        </div>
                    </div>
                </section>
            </main>
        )
    }

    const heroTopic = getTopicStyle(heroDoc)
    const heroAuthor = getAuthor(heroDoc, 0)
    const heroMinutes = getReadMinutes(heroDoc)

    return (
        <main className="w-full bg-[linear-gradient(180deg,var(--background)_0%,var(--surface-container-lowest)_100%)] text-on-surface">
            <section className="border-b border-outline-variant bg-surface-container-lowest px-4 pb-16 pt-16 sm:px-6 md:px-8 lg:pb-20 lg:pt-20">
                <div className="mx-auto grid max-w-page gap-8 lg:grid-cols-12 lg:items-center lg:gap-12">
                    <div className="space-y-6 lg:col-span-7">
                        <FeedBadge
                            label="TRENDING NOW"
                            className="bg-secondary/15 text-secondary"
                        />

                        <div className="space-y-5">
                            <div className="max-w-2xl">
                                <span
                                    className={cn(
                                        'font-display block text-[1.35rem] leading-[1.08] tracking-[-0.03em] text-on-surface',
                                        heroTopic.textClassName
                                    )}
                                >
                                    {heroTopic.label}
                                </span>
                                <h1 className="font-display text-[clamp(2.1rem,4vw,3.1rem)] leading-[1.08] font-bold tracking-[-0.04em] text-on-surface">
                                    {heroDoc.title}
                                </h1>
                            </div>

                            <p className="max-w-2xl text-body-lg text-on-surface-variant">
                                {heroDoc.summary}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 pt-2 text-sm text-on-surface-variant">
                            <div className="flex items-center gap-3">
                                <span className="inline-flex size-10 items-center justify-center rounded-full border border-outline-variant bg-surface-container-low text-primary">
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

                            <div className="h-8 w-px bg-outline-variant" />

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
                            href={getDocHref(heroDoc)}
                            className="ds-button-primary inline-flex"
                        >
                            READ ARTICLE
                        </Link>
                    </div>

                    <div className="relative lg:col-span-5">
                        <div className="absolute -left-8 bottom-0 size-40 rounded-full bg-secondary/10 blur-3xl" />
                        <div className="absolute -right-8 top-0 size-48 rounded-full bg-primary/10 blur-3xl" />
                        <div className="ds-code-shell relative p-4">
                            <div className="relative aspect-[1/1.02] overflow-hidden border border-outline-variant bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))]">
                                <div className="absolute inset-[12%] border border-outline-variant" />
                                <div className="absolute inset-[20%] border border-outline-variant" />
                                <div className="absolute inset-[28%] border border-outline-variant" />
                                <div className="absolute inset-[36%] border border-primary/20 shadow-glow-primary" />
                                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.03),transparent_40%,rgba(255,255,255,0.02))]" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="px-4 py-12 sm:px-6 md:px-8 lg:py-16">
                <div className="mx-auto max-w-page space-y-10 lg:space-y-12">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <span className="h-8 w-2 bg-primary" />
                                <h2 className="font-display text-[1.9rem] leading-[1.08] tracking-[-0.04em] text-on-surface">
                                    Latest Technical Insights
                                </h2>
                            </div>
                            <p className="font-body text-sm tracking-[0.16em] uppercase text-on-surface-variant">
                                Precision curated knowledge
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {CATEGORY_FILTERS.map((filter) => {
                                return (
                                    <Link
                                        key={filter.key}
                                        href={getFilterHref(filter.key)}
                                        className={cn(
                                            'ds-outline-button px-4.25 py-2.25 text-sm',
                                            activeFilter === filter.key
                                                ? 'border-primary bg-surface-container text-primary shadow-glow-primary'
                                                : 'text-on-surface-variant hover:text-on-surface'
                                        )}
                                    >
                                        {filter.label}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-6">
                        {featuredDoc && (
                            <FeaturedCard doc={featuredDoc} index={1} />
                        )}
                        {compactDoc && (
                            <CompactCard doc={compactDoc} index={2} />
                        )}
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

                        <NewsletterInjectionCard />

                        {supportDoc ? (
                            <CompactCard doc={supportDoc} index={4} />
                        ) : (
                            <TextSupportCard
                                title={PLACEHOLDER_UI.title}
                                summary={PLACEHOLDER_UI.summary}
                                topic={PLACEHOLDER_UI.topic}
                                footer={
                                    <div className="flex items-center gap-3 text-[0.75rem] uppercase tracking-[0.08em] text-on-surface-variant">
                                        <span className="inline-flex size-8 items-center justify-center rounded-full border border-outline-variant bg-surface-container-low">
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
                            href={activeFilter === 'all' ? '/docs' : '/feed'}
                            className="ds-outline-button gap-4 px-8 py-3 text-sm sm:px-10 sm:py-4 sm:text-base"
                        >
                            {activeFilter === 'all'
                                ? 'BROWSE DOCUMENT INDEX'
                                : 'RESET TO ALL FEED'}
                            <ArrowRight className="size-4" />
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    )
}
