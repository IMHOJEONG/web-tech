import {
    buildArticleJsonLd,
    serializeJsonLd,
    type ArticleSharingSource,
} from '~/lib/article-sharing'
import type { AppLocale } from '~/shared/i18n/locale-path'

export function ArticleStructuredData({
    article,
    locale,
}: {
    article: ArticleSharingSource
    locale: AppLocale
}) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: serializeJsonLd(buildArticleJsonLd(article, locale)),
            }}
        />
    )
}
