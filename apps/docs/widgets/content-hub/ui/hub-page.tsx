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
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.14),transparent_34%)]" />
                    <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(260px,0.65fr)] lg:items-end">
                        <div className="space-y-3">
                            <p className="font-display text-label-md uppercase text-primary">
                                {eyebrow}
                            </p>
                            <h1 className="max-w-4xl font-display text-3xl font-extrabold leading-tight tracking-tight text-on-surface sm:text-4xl lg:text-[2.75rem]">
                                {title}
                            </h1>
                            <p className="max-w-2xl text-sm leading-7 text-on-surface-variant sm:text-base">
                                {description}
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                            {stats.map((stat) => (
                                <div
                                    key={stat.label}
                                    className="ds-panel-muted p-3.5"
                                >
                                    <p className="text-xs uppercase tracking-[0.08em] text-outline">
                                        {stat.label}
                                    </p>
                                    <p className="mt-1.5 font-display text-xl font-semibold text-on-surface">
                                        {stat.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-3">
                    {panels.map((panel) => (
                        <article
                            key={panel.title}
                            className="ds-card bg-surface-container-low p-5"
                        >
                            <h2 className="font-display text-headline-md text-on-surface">
                                {panel.title}
                            </h2>
                            <p className="mt-2 text-body-md text-on-surface-variant">
                                {panel.description}
                            </p>
                            <ul className="mt-4 space-y-2 text-sm text-on-surface">
                                {panel.items.map((item) => (
                                    <li
                                        key={item}
                                        className="ds-panel-muted rounded-md px-3 py-2"
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
                                        className="ds-card bg-surface-container-low p-3.5"
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
