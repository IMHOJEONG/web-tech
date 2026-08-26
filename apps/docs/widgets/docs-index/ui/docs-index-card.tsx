import { getTime } from '@web-tech/ui/lib/time'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import type { SearchData } from '~/lib/get-search-data'
import { buildSearchResultItem } from '~/lib/search-result-contract'

type DocsIndexCardProps = {
    doc: SearchData
    keyword?: string
}

function getDocSourceMessageKey(source: SearchData['contentSource']) {
    return source === 'remote' ? 'remote' : 'local'
}

export async function DocsIndexCard({ doc, keyword }: DocsIndexCardProps) {
    const t = await getTranslations('docsIndex')
    const resultItem = buildSearchResultItem(doc, keyword)
    const visibleTags = doc.tags?.slice(0, 3) ?? []

    return (
        <Link
            href={doc.href}
            className="group block rounded-2xl border border-border bg-surface-container-lowest p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-deep"
        >
            <article className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-display text-[0.68rem] font-semibold tracking-[0.16em] text-primary uppercase">
                            {doc.section}
                        </span>
                        {doc.date && (
                            <>
                                <span className="text-xs text-outline">/</span>
                                <span className="text-xs text-outline">
                                    {getTime(doc.date)}
                                </span>
                            </>
                        )}
                    </div>

                    <div className="space-y-2">
                        <h3
                            className="text-base font-semibold tracking-[-0.02em] text-on-surface transition-colors group-hover:text-primary sm:text-lg [&_.search-highlight]:rounded-sm [&_.search-highlight]:bg-primary-container/70 [&_.search-highlight]:px-1 [&_.search-highlight]:py-px [&_.search-highlight]:font-medium [&_.search-highlight]:text-on-primary-container dark:[&_.search-highlight]:bg-primary/18 dark:[&_.search-highlight]:text-primary-fixed"
                            dangerouslySetInnerHTML={{
                                __html: resultItem.preview.titleHtml,
                            }}
                        />
                        {(keyword || doc.summary) && (
                            <p
                                className="line-clamp-2 text-sm leading-6 text-on-surface-variant [&_.search-highlight]:rounded-sm [&_.search-highlight]:bg-primary-container/70 [&_.search-highlight]:px-1 [&_.search-highlight]:py-px [&_.search-highlight]:font-medium [&_.search-highlight]:text-on-primary-container dark:[&_.search-highlight]:bg-primary/18 dark:[&_.search-highlight]:text-primary-fixed"
                                dangerouslySetInnerHTML={{
                                    __html: resultItem.preview.excerptHtml,
                                }}
                            />
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-outline">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-container-low px-2.5 py-1 font-medium text-outline">
                            <span className="size-1.5 rounded-full bg-primary/70" />
                            {t(
                                `card.sources.${getDocSourceMessageKey(doc.contentSource)}`
                            )}
                        </span>
                        {doc.readMinutes && (
                            <span className="rounded-full border border-border bg-surface-container-low px-2.5 py-1 font-medium text-outline">
                                {t('card.readMinutes', {
                                    count: doc.readMinutes,
                                })}
                            </span>
                        )}
                        {doc.topicLabel && (
                            <span className="rounded-full border border-border bg-surface-container-low px-2.5 py-1 font-medium text-outline">
                                {doc.topicLabel}
                            </span>
                        )}
                        {visibleTags.map((tag) => (
                            <span
                                key={tag}
                                className="rounded-full border border-transparent bg-transparent px-1.5 py-1 font-medium text-outline"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>

                <span className="shrink-0 self-start rounded-full border border-border px-3 py-1.5 font-display text-[0.65rem] font-semibold tracking-[0.14em] text-outline uppercase transition-colors group-hover:border-primary/40 group-hover:text-primary">
                    {t('card.open')}
                </span>
            </article>
        </Link>
    )
}
