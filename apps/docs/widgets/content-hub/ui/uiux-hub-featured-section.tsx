import Image from 'next/image'
import Link from 'next/link'
import { UiUxSmallArticleCard } from './uiux-small-article-card'
import { UIUX_FALLBACK_IMAGES, type UiUxDoc } from './uiux-hub.types'

export function UiUxHubFeaturedSection({
    featured,
    secondaryOne,
    secondaryTwo,
    primaryLabel,
    secondaryLabel,
    actionLabel,
    researchLabel,
    guideLabel,
}: {
    featured: UiUxDoc
    secondaryOne: UiUxDoc
    secondaryTwo: UiUxDoc
    primaryLabel: string
    secondaryLabel: string
    actionLabel: string
    researchLabel: string
    guideLabel: string
}) {
    return (
        <section className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <Link
                href={featured.href}
                className="group ds-card relative min-h-128 overflow-hidden bg-zinc-950 text-zinc-50"
            >
                <div className="absolute inset-0">
                    <Image
                        src={
                            featured.thumbnail ?? UIUX_FALLBACK_IMAGES.featured
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
                            {primaryLabel}
                        </span>
                        <span className="rounded-sm border border-white/20 px-3 py-1 text-[0.6875rem] font-semibold tracking-[0.18em] text-white/80 uppercase">
                            {secondaryLabel}
                        </span>
                    </div>
                    <h2 className="max-w-[14ch] text-3xl font-bold leading-[1.02] tracking-[-0.05em] text-white sm:text-4xl">
                        {featured.title}
                    </h2>
                    <p className="mt-5 max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
                        {featured.summary}
                    </p>
                    <div className="mt-6 inline-flex max-w-full flex-wrap items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-white">
                        <span>{actionLabel}</span>
                        <span aria-hidden="true">↗</span>
                    </div>
                </div>
            </Link>

            <div className="grid min-w-0 gap-6">
                <UiUxSmallArticleCard
                    eyebrow={researchLabel}
                    doc={secondaryOne}
                    imageSrc={UIUX_FALLBACK_IMAGES.first}
                />
                <UiUxSmallArticleCard
                    eyebrow={guideLabel}
                    doc={secondaryTwo}
                    imageSrc={UIUX_FALLBACK_IMAGES.second}
                />
            </div>
        </section>
    )
}
