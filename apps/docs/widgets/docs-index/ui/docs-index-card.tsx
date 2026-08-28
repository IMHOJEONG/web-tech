import { cn } from '@web-tech/ui/lib/utils'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { SearchData } from '~/lib/get-search-data'
import { buildSearchResultItem } from '~/lib/search-result-contract'
import { DocumentDateText } from '~/shared/ui/document-date-text'
import { DocumentMetaPills } from '~/shared/ui/document-meta-pills'

type DocsIndexCardProps = {
    className?: string
    doc: SearchData
    keyword?: string
    style?: CSSProperties
}

function getDocSourceMessageKey(source: SearchData['contentSource']) {
    return source === 'remote' ? 'remote' : 'local'
}

export async function DocsIndexCard({
    className,
    doc,
    keyword,
    style,
}: DocsIndexCardProps) {
    const t = await getTranslations('docsIndex')
    const resultItem = buildSearchResultItem(doc, keyword)
    const metaPills = [
        {
            key: 'source',
            label: t(
                `card.sources.${getDocSourceMessageKey(doc.contentSource)}`
            ),
            tone: 'source' as const,
        },
        ...(doc.readMinutes
            ? [
                  {
                      key: 'read-minutes',
                      label: t('card.readMinutes', {
                          count: doc.readMinutes,
                      }),
                  },
              ]
            : []),
        ...(doc.topicLabel
            ? [
                  {
                      key: 'topic',
                      label: doc.topicLabel,
                  },
              ]
            : []),
        ...(doc.tags?.slice(0, 3).map((tag, index) => ({
            key: `tag:${tag}:${index}`,
            label: `#${tag}`,
            tone: 'tag' as const,
        })) ?? []),
    ]

    return (
        <Link
            href={doc.href}
            style={style}
            className={cn(
                'motion-layout group block rounded-2xl border border-border bg-surface-container-lowest p-4 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-deep',
                className
            )}
        >
            <article className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-display text-[0.68rem] font-semibold tracking-[0.16em] text-primary uppercase">
                            {doc.section}
                        </span>
                        {doc.date && (
                            <>
                                <span className="text-xs text-outline">/</span>
                                <DocumentDateText
                                    date={doc.date}
                                    className="text-xs text-outline"
                                />
                            </>
                        )}
                    </div>

                    <div className="space-y-2">
                        <h3
                            className="break-keep text-base font-semibold tracking-[-0.02em] text-on-surface transition-colors [overflow-wrap:anywhere] group-hover:text-primary md:text-lg [&_.search-highlight]:rounded-sm [&_.search-highlight]:bg-primary-container/70 [&_.search-highlight]:px-1 [&_.search-highlight]:py-px [&_.search-highlight]:font-medium [&_.search-highlight]:text-on-primary-container dark:[&_.search-highlight]:bg-primary/18 dark:[&_.search-highlight]:text-primary-fixed"
                            dangerouslySetInnerHTML={{
                                __html: resultItem.preview.titleHtml,
                            }}
                        />
                        {(keyword || doc.summary) && (
                            <p
                                className="line-clamp-2 break-keep text-sm leading-6 text-on-surface-variant [overflow-wrap:anywhere] [&_.search-highlight]:rounded-sm [&_.search-highlight]:bg-primary-container/70 [&_.search-highlight]:px-1 [&_.search-highlight]:py-px [&_.search-highlight]:font-medium [&_.search-highlight]:text-on-primary-container dark:[&_.search-highlight]:bg-primary/18 dark:[&_.search-highlight]:text-primary-fixed"
                                dangerouslySetInnerHTML={{
                                    __html: resultItem.preview.excerptHtml,
                                }}
                            />
                        )}
                    </div>

                    <DocumentMetaPills items={metaPills} />
                </div>

                <span className="shrink-0 self-start rounded-full border border-border px-3 py-1.5 font-display text-[0.65rem] font-semibold tracking-[0.14em] text-outline uppercase transition-colors group-hover:border-primary/40 group-hover:text-primary">
                    {t('card.open')}
                </span>
            </article>
        </Link>
    )
}
