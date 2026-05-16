import Link from 'next/link'
import { ArticleDetailNewsletterCard } from '~/widgets/article-detail/ui/article-detail-newsletter-card'
import { ArticleDetailSidebarSection } from '~/widgets/article-detail/ui/article-detail-sidebar-section'
import type { ArticleDetailSidebarProps } from '~/widgets/article-detail/ui/article-detail.types'

export function ArticleDetailSidebar({
    tocTitle,
    tocItems,
    joinTitle,
    sidebarNewsletter,
    relatedTitle,
    relatedSignals,
}: ArticleDetailSidebarProps) {
    return (
        <aside className="hidden space-y-8 lg:sticky lg:top-28 lg:block lg:self-start">
            <ArticleDetailSidebarSection title={tocTitle}>
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
            </ArticleDetailSidebarSection>

            <ArticleDetailSidebarSection title={joinTitle}>
                <ArticleDetailNewsletterCard compact {...sidebarNewsletter} />
            </ArticleDetailSidebarSection>

            <ArticleDetailSidebarSection title={relatedTitle}>
                <div className="space-y-2">
                    {relatedSignals.map((signal) => (
                        <Link
                            key={signal.title}
                            href={signal.href}
                            className="ds-focus-ring block rounded-sm border border-transparent px-2 py-2 transition-colors hover:bg-surface-container-low"
                        >
                            <div className="inline-flex rounded-sm bg-surface-container px-1.5 py-0.5 font-display text-[0.625rem] tracking-[0.08em] text-on-surface-variant uppercase">
                                {signal.category}
                            </div>
                            <h3 className="mt-2 font-display text-base leading-[1.4] text-on-surface">
                                {signal.title}
                            </h3>
                            <p className="mt-1 font-display text-[0.625rem] tracking-widest text-outline uppercase">
                                {signal.meta}
                            </p>
                        </Link>
                    ))}
                </div>
            </ArticleDetailSidebarSection>
        </aside>
    )
}
