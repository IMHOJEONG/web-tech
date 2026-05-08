import type { TocItem } from 'remark-flexible-toc'
import Toc from '~/widgets/article-toc/ui/toc'
import { getTranslations } from 'next-intl/server'

export async function ArticleContentLayout({
    toc,
    children,
}: {
    toc?: TocItem[]
    children: React.ReactNode
}) {
    const t = await getTranslations('articleDetail.sidebar')

    return (
        <div className="mx-auto grid w-full max-w-page gap-6 px-4 pb-16 pt-3 sm:px-6 sm:pt-4 md:px-8 lg:gap-8 lg:pb-20 lg:pt-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
            <aside className="hidden lg:block">
                <div className="sticky top-16">
                    <Toc toc={toc} title={t('tocTitle')} />
                </div>
            </aside>

            <div className="min-w-0">{children}</div>
        </div>
    )
}
