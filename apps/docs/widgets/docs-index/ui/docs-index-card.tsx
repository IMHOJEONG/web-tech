import { cn } from '@web-tech/ui/lib/utils'
import { getTranslations } from 'next-intl/server'
import { Link } from '~/shared/i18n/navigation'
import type { CSSProperties } from 'react'
import type { SearchData } from '~/lib/get-search-data'
import { buildSearchResultItem } from '~/lib/search-result-contract'
import { DocumentDateText } from '~/shared/ui/document-date-text'
import { DocumentMetaText } from '~/shared/ui/document-meta-text'

type DocsIndexCardProps = {
    className?: string
    doc: SearchData
    keyword?: string
    style?: CSSProperties
}

export async function DocsIndexCard({
    className,
    doc,
    keyword,
    style,
}: DocsIndexCardProps) {
    const t = await getTranslations('docsIndex')
    const resultItem = buildSearchResultItem(doc, keyword)
    const meta = [
        ...(doc.readMinutes
            ? [t('card.readMinutes', { count: doc.readMinutes })]
            : []),
        ...(doc.topicLabel &&
        doc.topicLabel.toLowerCase() !== doc.section.toLowerCase()
            ? [doc.topicLabel]
            : []),
        ...(doc.tags?.slice(0, 2).map((tag) => `#${tag}`) ?? []),
    ]

    return (
        <Link
            href={doc.href}
            style={style}
            data-touch-target="docs-index"
            className={cn(
                'ds-focus-ring motion-layout group block min-w-0 rounded-sm py-6',
                className
            )}
        >
            <article className="min-w-0">
                <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-mono text-xs font-medium tracking-wide text-[var(--docs-interactive-text)] uppercase">
                            {doc.section}
                        </span>
                        {doc.date && (
                            <>
                                <span className="text-xs text-outline">/</span>
                                <DocumentDateText
                                    date={doc.date}
                                    className="font-mono text-xs text-on-surface-variant"
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

                    <DocumentMetaText items={meta} />
                </div>
            </article>
        </Link>
    )
}
