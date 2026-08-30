import { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { cache, Suspense } from 'react'
import { RemoteCodeCopyEnhancer } from '~/feature/code-block/ui/remote-code-copy-enhancer'
import { buildArticleRelatedDocuments } from '~/lib/article-related-documents'
import { buildArticleReadingNavigation } from '~/lib/article-reading-navigation'
import { buildArticleMetadata } from '~/lib/article-metadata'
import {
    getDocHref,
    shouldRedirectToCanonicalDocRoute,
} from '~/lib/get-doc-route'
import { getDocByRoutePath, getSortedPostsData } from '~/lib/get-document'
import { renderArticleContent } from '~/lib/render-article-content'
import { components } from '~/mdx-components'
import { LoadingComponent } from '~/shared/loading-component'
import { ArticleContentLayout } from '~/widgets/article-detail/ui/article-content-layout'

const getCachedDocByRoutePath = cache(getDocByRoutePath)
const getCachedSortedPostsData = cache(getSortedPostsData)

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
    const { slugParts } = await params
    const routePath = slugParts.join('/')
    const target = await getCachedDocByRoutePath(routePath)

    if (!target) {
        notFound()
    }

    if (shouldRedirectToCanonicalDocRoute(target, routePath)) {
        permanentRedirect(getDocHref(target))
    }

    const renderedArticle = await renderArticleContent(target, {
        codeHighlight: target.contentSource !== 'local',
        components,
    })
    const navigationDocs = await getCachedSortedPostsData({
        includeRemote: target.contentSource === 'remote',
    })
    const readingNavigation = buildArticleReadingNavigation(
        navigationDocs,
        target
    )
    const relatedDocuments = buildArticleRelatedDocuments(
        navigationDocs,
        target
    )

    if (renderedArticle.mode === 'html') {
        return (
            <ArticleContentLayout
                relatedDocuments={relatedDocuments}
                readingNavigation={readingNavigation}
                toc={renderedArticle.toc}
            >
                <div className="mdx-wrapper">
                    <article
                        dangerouslySetInnerHTML={{
                            __html: renderedArticle.content,
                        }}
                    />
                    <RemoteCodeCopyEnhancer />
                </div>
            </ArticleContentLayout>
        )
    }

    return (
        <ArticleContentLayout
            relatedDocuments={relatedDocuments}
            readingNavigation={readingNavigation}
            toc={renderedArticle.toc}
        >
            <div className="mdx-wrapper">
                <Suspense fallback={<LoadingComponent />}>
                    {renderedArticle.content}
                </Suspense>
            </div>
        </ArticleContentLayout>
    )
}
