import { cn } from '@web-tech/ui/lib/utils'
import Link from 'next/link'
import type { ArticleRelatedDocumentItem } from '~/lib/article-related-documents'
import { DocumentDateText } from '~/shared/ui/document-date-text'
import { DocumentMetaPills } from '~/shared/ui/document-meta-pills'

type ArticleRelatedDocumentsProps = {
    className?: string
    items: ArticleRelatedDocumentItem[]
    labels: {
        description: string
        sectionTitle: string
        sourceLocal: string
        sourceRemote: string
    }
}

function getMetaItems(
    item: ArticleRelatedDocumentItem,
    labels: ArticleRelatedDocumentsProps['labels']
) {
    return [
        item.topicLabel
            ? {
                  key: 'topic',
                  label: item.topicLabel,
                  tone: 'tag' as const,
              }
            : null,
        item.contentSource
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

export function ArticleRelatedDocuments({
    className,
    items,
    labels,
}: ArticleRelatedDocumentsProps) {
    if (items.length === 0) {
        return null
    }

    return (
        <section
            className={cn(
                'mt-12 rounded-3xl border border-border bg-surface-container-lowest p-5 shadow-soft md:mt-14 md:p-6',
                className
            )}
            aria-labelledby="article-related-documents-title"
        >
            <div className="mb-5 max-w-2xl">
                <h2
                    id="article-related-documents-title"
                    className="font-display text-sm font-semibold uppercase tracking-[0.22em] text-outline"
                >
                    {labels.sectionTitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                    {labels.description}
                </p>
            </div>

            <div className="grid gap-3">
                {items.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="group grid min-w-0 gap-3 rounded-2xl border border-border bg-background/80 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-surface-container-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                    >
                        <span className="min-w-0">
                            <span className="line-clamp-2 text-lg font-semibold leading-tight text-on-surface transition-colors group-hover:text-primary">
                                {item.title}
                            </span>
                            {item.summary && (
                                <span className="mt-1.5 line-clamp-2 text-sm leading-6 text-on-surface-variant">
                                    {item.summary}
                                </span>
                            )}
                        </span>

                        <span className="flex flex-wrap items-center gap-2 md:justify-end">
                            <DocumentDateText
                                date={item.date}
                                className="text-xs font-medium text-outline"
                            />
                            <DocumentMetaPills
                                items={[
                                    ...getMetaItems(item, labels),
                                    ...item.tags.slice(0, 2).map((tag) => ({
                                        key: `tag-${tag}`,
                                        label: `#${tag}`,
                                        tone: 'tag' as const,
                                    })),
                                ]}
                            />
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    )
}
