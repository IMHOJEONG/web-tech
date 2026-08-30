import Link from 'next/link'
import MainCard from '~/entities/document/ui/main-card'
import { Metadata } from '~/lib/get-document'
import { getDocHref } from '~/lib/get-doc-route'

type HubPanel = {
    title: string
    description: string
    items: string[]
}

type HubPageProps = {
    eyebrow: string
    title: string
    description: string
    stats: Array<{ label: string; value: string }>
    docs: Array<Partial<Metadata> & { href?: string }>
    panels: HubPanel[]
    latestEyebrow: string
    latestTitle: string
    latestActionHref: string
    latestActionLabel: string
    emptyTitle: string
    emptyDescription: string
}

export function HubPage({
    eyebrow,
    title,
    description,
    stats,
    docs,
    panels,
    latestEyebrow,
    latestTitle,
    latestActionHref,
    latestActionLabel,
    emptyTitle,
    emptyDescription,
}: HubPageProps) {
    return (
        <main className="docs-shell px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            <div className="space-y-7">
                <section className="ds-panel relative overflow-hidden p-5 sm:p-6 lg:p-7">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,107,31,0.11),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.12),transparent_34%)]" />
                    <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.42fr)] lg:items-end">
                        <div className="max-w-4xl space-y-3">
                            <p className="font-display text-label-md uppercase text-primary">
                                {eyebrow}
                            </p>
                            <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-on-surface sm:text-4xl lg:text-[2.5rem]">
                                {title}
                            </h1>
                            <p className="max-w-2xl text-sm leading-7 text-on-surface-variant sm:text-base">
                                {description}
                            </p>
                        </div>
                        <dl className="rounded-3xl border border-border bg-surface-container-lowest/85 p-4 backdrop-blur">
                            {stats.map((stat) => (
                                <div
                                    key={stat.label}
                                    className="flex items-center justify-between gap-4 border-b border-border/70 py-3 first:pt-0 last:border-b-0 last:pb-0"
                                >
                                    <dt className="text-xs font-medium tracking-[0.08em] text-outline uppercase">
                                        {stat.label}
                                    </dt>
                                    <dd className="font-display text-lg font-semibold tracking-tight text-on-surface">
                                        {stat.value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </section>

                <section className="grid gap-3 lg:grid-cols-3">
                    {panels.map((panel, index) => (
                        <article
                            key={panel.title}
                            className="rounded-3xl border border-border bg-surface-container-lowest p-4 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-deep"
                        >
                            <div className="flex items-center gap-3">
                                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-xs font-semibold text-primary">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <h2 className="font-display text-lg font-semibold tracking-tight text-on-surface">
                                    {panel.title}
                                </h2>
                            </div>
                            <p className="mt-3 line-clamp-2 text-sm leading-6 text-on-surface-variant">
                                {panel.description}
                            </p>
                            <ul className="mt-4 flex flex-wrap gap-2">
                                {panel.items.map((item) => (
                                    <li
                                        key={item}
                                        className="rounded-full border border-border bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant"
                                    >
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </section>

                <section className="space-y-4">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <p className="font-display text-label-md uppercase text-primary">
                                {latestEyebrow}
                            </p>
                            <h2 className="font-display text-headline-lg text-on-surface">
                                {latestTitle}
                            </h2>
                        </div>
                        <Link
                            href={latestActionHref}
                            className="text-sm text-primary transition-colors hover:text-secondary"
                        >
                            {latestActionLabel}
                        </Link>
                    </div>

                    {docs.length > 0 ? (
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
                            {docs.map((doc) => {
                                if (!doc.slug || !doc.id) {
                                    return null
                                }

                                return (
                                    <Link
                                        href={doc.href ?? getDocHref(doc)}
                                        key={doc.id}
                                        className="group ds-card bg-surface-container-low p-3.5"
                                    >
                                        <MainCard doc={doc} />
                                    </Link>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="ds-card bg-surface-container-low p-6">
                            <h3 className="font-display text-xl text-on-surface">
                                {emptyTitle}
                            </h3>
                            <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">
                                {emptyDescription}
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </main>
    )
}
