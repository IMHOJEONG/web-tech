import { cn } from '@web-tech/ui/lib/utils'
import Link from 'next/link'
import type {
    ArticleReadingNavigation as ArticleReadingNavigationData,
    ArticleReadingNavigationItem,
} from '~/lib/article-reading-navigation'
import { shouldShowContentSourceBadge } from '~/lib/content-source-visibility'
import { DocumentDateText } from '~/shared/ui/document-date-text'
import { DocumentMetaPills } from '~/shared/ui/document-meta-pills'

type ArticleReadingNavigationProps = {
    className?: string
    labels: {
        lastUpdated: string
        next: string
        previous: string
        sectionTitle: string
        sourceLocal: string
        sourceRemote: string
    }
    navigation: ArticleReadingNavigationData
}

function getMetaItems(
    item: ArticleReadingNavigationItem,
    labels: ArticleReadingNavigationProps['labels']
) {
    const showContentSourceBadge = shouldShowContentSourceBadge()

    return [
        item.topicLabel
            ? {
                  key: 'topic',
                  label: item.topicLabel,
                  tone: 'tag' as const,
              }
            : null,
        showContentSourceBadge && item.contentSource
            ? {
                  key: 'source',
                  label:
                      item.contentSource === 'remote'
                          ? labels.sourceRemote
                          : labels.sourceLocal,
                  tone: 'source' as const,
              }
            : null,
        typeof item.readMinutes === 'number'
            ? {
                  key: 'read-minutes',
                  label: `${item.readMinutes} min`,
              }
            : null,
    ].filter((item) => item !== null)
}

function ArticleReadingNavigationCard({
    item,
    label,
    labels,
}: {
    item: ArticleReadingNavigationItem | null
    label: string
    labels: ArticleReadingNavigationProps['labels']
}) {
    if (!item) {
        return null
    }

    return (
        <Link
            href={item.href}
            className="group flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-surface-container-lowest p-5 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-surface-container-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-outline">
                {label}
            </span>
            <span className="line-clamp-2 text-xl font-semibold leading-tight text-on-surface transition-colors group-hover:text-primary">
                {item.title}
            </span>
            {item.summary && (
                <span className="line-clamp-2 text-sm leading-6 text-on-surface-variant">
                    {item.summary}
                </span>
            )}
            <div className="mt-auto flex flex-wrap items-center gap-2">
                <DocumentDateText
                    date={item.date}
                    className="text-xs font-medium text-outline"
                />
                <DocumentMetaPills items={getMetaItems(item, labels)} />
            </div>
        </Link>
    )
}

export function ArticleReadingNavigation({
    className,
    labels,
    navigation,
}: ArticleReadingNavigationProps) {
    if (!navigation.previous && !navigation.next && !navigation.lastUpdated) {
        return null
    }

    return (
        <section
            className={cn(
                'mt-12 border-t border-border pt-8 md:mt-14',
                className
            )}
            aria-labelledby="article-reading-navigation-title"
        >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2
                    id="article-reading-navigation-title"
                    className="font-display text-sm font-semibold uppercase tracking-[0.22em] text-outline"
                >
                    {labels.sectionTitle}
                </h2>
                {navigation.lastUpdated && (
                    <p className="rounded-full border border-border bg-surface-container-low px-3 py-1.5 text-xs font-medium text-on-surface-variant">
                        {labels.lastUpdated}{' '}
                        <DocumentDateText
                            date={navigation.lastUpdated}
                            className="text-on-surface"
                        />
                    </p>
                )}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <ArticleReadingNavigationCard
                    item={navigation.previous}
                    label={labels.previous}
                    labels={labels}
                />
                <ArticleReadingNavigationCard
                    item={navigation.next}
                    label={labels.next}
                    labels={labels}
                />
            </div>
        </section>
    )
}
