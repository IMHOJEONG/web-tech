import { Link } from '~/shared/i18n/navigation'
import type { UiUxDoc } from '../model/uiux-hub-docs'

export function UiUxHubMoreArticlesSection({
    moreArticles,
    fallbackDate,
}: {
    moreArticles: UiUxDoc[]
    fallbackDate: string
}) {
    if (moreArticles.length === 0) return null
    return (
        <section data-testid="uiux-more-articles" className="space-y-6">
            <div className="grid gap-6 border-t border-outline-variant pt-8 md:grid-cols-3">
                {moreArticles.map((doc) => (
                    <Link
                        key={doc.href}
                        href={doc.href}
                        className="group border-t-2 border-outline pt-5"
                    >
                        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-outline">
                            {doc.date || fallbackDate}
                        </p>
                        <h2 className="mt-4 text-2xl font-bold leading-tight tracking-[-0.04em] text-on-surface transition-colors group-hover:text-primary">
                            {doc.title}
                        </h2>
                        <p className="mt-4 text-sm leading-6 text-on-surface-variant">
                            {doc.summary}
                        </p>
                    </Link>
                ))}
            </div>
        </section>
    )
}
