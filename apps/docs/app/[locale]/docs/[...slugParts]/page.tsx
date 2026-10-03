import { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import {
    isLocale,
    defaultLocale,
    localizePath,
} from '~/shared/i18n/locale-path'
import { cache, Suspense } from 'react'
import { RemoteCodeCopyEnhancer } from '~/feature/code-block/ui/remote-code-copy-enhancer'
import { createArticleTiming } from '~/lib/article-timing'
import { buildArticleMetadata } from '~/lib/localized-metadata'
import {
    getDocHref,
    shouldRedirectToCanonicalDocRoute,
} from '~/lib/get-doc-route'
import { getDocByRoutePath } from '~/lib/get-document'
import { renderArticleContent } from '~/lib/render-article-content'
import { components } from '~/mdx-components'
import { LoadingComponent } from '~/shared/loading-component'
import { ArticleContentLayout } from '~/widgets/article-detail/ui/article-content-layout'
import { ArticleSupplementary } from '~/widgets/article-detail/ui/article-supplementary'
import { ArticleStructuredData } from '~/widgets/article-detail/ui/article-structured-data'

const getCachedDocByRoutePath = cache(getDocByRoutePath)

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slugParts: string[] }>
}): Promise<Metadata> {
    const { slugParts } = await params
    const routePath = slugParts.join('/')
    const target = await getCachedDocByRoutePath(routePath)

    if (!target) {
        return {}
    }

    return buildArticleMetadata(target)
}

export default async function Page({
    params,
}: {
    params: Promise<{ slugParts: string[] }>
}) {
    const measure = createArticleTiming()
    const { slugParts } = await params
    const routePath = slugParts.join('/')
    const target = await measure('document-select', () =>
        getCachedDocByRoutePath(routePath)
    )

    if (!target) {
        notFound()
    }

    const value = await getLocale()
    const locale = isLocale(value) ? value : defaultLocale
    if (shouldRedirectToCanonicalDocRoute(target, routePath)) {
        permanentRedirect(localizePath(getDocHref(target), locale))
    }

    const renderedArticle = await measure('content-render', () =>
        renderArticleContent(target, {
            codeHighlight: target.contentSource !== 'local',
            components,
        })
    )
    const supplementary = (
        <ArticleSupplementary target={target} measure={measure} />
    )

    return (
        <>
            <ArticleStructuredData article={target} locale={locale} />
            <ArticleContentLayout
                fallbackTitle={
                    renderedArticle.hasTitle ? undefined : target.title
                }
                supplementary={supplementary}
                toc={renderedArticle.toc}
            >
                <div className="mdx-wrapper">
                    {renderedArticle.mode === 'html' ? (
                        <>
                            <article
                                dangerouslySetInnerHTML={{
                                    __html: renderedArticle.content,
                                }}
                            />
                            <RemoteCodeCopyEnhancer />
                        </>
                    ) : (
                        <Suspense fallback={<LoadingComponent />}>
                            {renderedArticle.content}
                        </Suspense>
                    )}
                </div>
            </ArticleContentLayout>
        </>
    )
}
