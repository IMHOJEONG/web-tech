import Link from 'next/link'
import type { UiUxDoc } from './uiux-hub.types'

export function UiUxHubMoreArticlesSection({
    moreArticles,
    fallbackDate,
    loadMoreLabel,
}: {
    moreArticles: UiUxDoc[]
    fallbackDate: string
    loadMoreLabel: string
}) {
    return (
        <section className="space-y-6">
            <div className="grid gap-6 border-t border-outline-variant pt-8 md:grid-cols-3">
                {moreArticles.map((doc) => (
                    <Link
                        key={doc.id}
                        href={doc.href}
                        className="group border-t-2 border-outline pt-5"
                    >
                        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-outline">
                            {doc.date || fallbackDate}
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
                    className="inline-flex max-w-full items-center justify-center gap-3 border border-outline px-6 py-5 text-center text-[0.72rem] font-semibold tracking-[0.16em] text-on-surface uppercase transition-colors hover:border-primary hover:text-primary sm:min-h-16 sm:px-10 sm:text-left sm:tracking-[0.24em]"
                >
                    <span className="break-keep whitespace-normal">
                        {loadMoreLabel}
                    </span>
                    <span aria-hidden="true">⌄</span>
                </Link>
            </div>
        </section>
    )
}
