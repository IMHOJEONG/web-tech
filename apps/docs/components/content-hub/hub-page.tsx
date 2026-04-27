import { cn } from '@web-tech/ui/lib/utils'
import Link from 'next/link'
import MainCard from '~/components/main-card'
import { Metadata } from '~/lib/get-document'

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
    docs: Partial<Metadata>[]
    panels: HubPanel[]
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
    emptyTitle,
    emptyDescription,
}: HubPageProps) {
    return (
        <main className="docs-shell px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <div className="space-y-8">
                <section className="relative overflow-hidden rounded-xl border border-white/8 bg-surface-container-lowest/80 p-6 sm:p-8">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.14),transparent_34%)]" />
                    <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
                        <div className="space-y-4">
                            <p className="font-display text-label-md uppercase text-cyan-400">
                                {eyebrow}
                            </p>
                            <h1 className="font-display text-headline-xl text-on-surface">
                                {title}
                            </h1>
                            <p className="max-w-2xl text-body-lg text-on-surface-variant">
                                {description}
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                            {stats.map((stat) => (
                                <div
                                    key={stat.label}
                                    className="ds-card bg-surface-container-low border-outline-variant p-4"
                                >
                                    <p className="text-xs uppercase tracking-[0.08em] text-on-surface-variant">
                                        {stat.label}
                                    </p>
                                    <p className="mt-2 font-display text-2xl font-semibold text-on-surface">
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
                                        className="rounded-md border border-outline-variant/70 bg-surface-container px-3 py-2"
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
                            <p className="font-display text-label-md uppercase text-cyan-400">
                                Latest
                            </p>
                            <h2 className="font-display text-headline-lg text-on-surface">
                                Curated entries
                            </h2>
                        </div>
                        <Link
                            href="/docs"
                            className="text-sm text-cyan-400 transition-colors hover:text-cyan-300"
                        >
                            View all docs
                        </Link>
                    </div>

                    {docs.length > 0 ? (
                        <div
                            className={cn(
                                'grid gap-4',
                                'grid-cols-[repeat(auto-fit,minmax(280px,1fr))]'
                            )}
                        >
                            {docs.map((doc) => {
                                if (!doc.slug || !doc.id) {
                                    return null
                                }

                                return (
                                    <Link
                                        href={`/docs/${doc.slug}`}
                                        key={doc.id}
                                        className="ds-card bg-surface-container-low p-4"
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
