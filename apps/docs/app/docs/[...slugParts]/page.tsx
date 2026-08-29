import { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { Suspense } from 'react'
import { cache } from 'react'
import { buildArticleMetadata } from '~/lib/article-metadata'
import {
    getDocHref,
    shouldRedirectToCanonicalDocRoute,
} from '~/lib/get-doc-route'
import { getDocByRoutePath } from '~/lib/get-document'
import { renderArticleContent } from '~/lib/render-article-content'
import { components } from '~/mdx-components'
import { LoadingComponent } from '~/shared/loading-component'
import { ArticleContentLayout } from '~/widgets/article-detail/ui/article-content-layout'

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

    if (renderedArticle.mode === 'html') {
        return (
            <ArticleContentLayout toc={renderedArticle.toc}>
                <div className="mdx-wrapper">
                    <article
                        dangerouslySetInnerHTML={{
                            __html: renderedArticle.content,
                        }}
                    />
                </div>
            </ArticleContentLayout>
        )
    }

    return (
        <ArticleContentLayout toc={renderedArticle.toc}>
            <div className="mdx-wrapper">
                <Suspense fallback={<LoadingComponent />}>
                    {renderedArticle.content}
                </Suspense>
            </div>
        </ArticleContentLayout>
    )
}
