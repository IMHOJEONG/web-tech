import { evaluate, EvaluateOptions } from 'next-mdx-remote-client/rsc'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import rehypeShiki from '@shikijs/rehype'
import remarkFlexibleToc, { TocItem } from 'remark-flexible-toc'
import { shikiRehypeOptions } from '~/lib/shiki-options.js'
import { getDocByRoutePath } from '~/lib/get-document'
import { components } from '~/mdx-components'
import { LoadingComponent } from '~/shared/loading-component'
import { normalizeRemoteArticleHtml } from '~/widgets/article-detail/model/normalize-remote-article-html'
import { ArticleContentLayout } from '~/widgets/article-detail/ui/article-content-layout'

type Scope = {
    readingTime: string
    toc?: TocItem[]
}

type Frontmatter = {
    title: string
    author: string
}

export default async function Page({
    params,
}: {
    params: Promise<{ slugParts: string[] }>
}) {
    const { slugParts } = await params
    const routePath = slugParts.join('/')
    const target = await getDocByRoutePath(routePath)

    if (!target) {
        notFound()
    }

    if (target.contentFormat === 'html') {
        const normalizedRemoteArticle = normalizeRemoteArticleHtml(
            target.content ?? ''
        )

        return (
            <ArticleContentLayout toc={normalizedRemoteArticle.toc}>
                <div className="mdx-wrapper">
                    <article
                        dangerouslySetInnerHTML={{
                            __html: normalizedRemoteArticle.content,
                        }}
                    />
                </div>
            </ArticleContentLayout>
        )
    }

    const options: EvaluateOptions<Scope> = {
        mdxOptions: {
            remarkPlugins: [remarkFlexibleToc],
            rehypePlugins: [[rehypeShiki, shikiRehypeOptions]],
        },
        parseFrontmatter: true,
        scope: {
            readingTime: '',
        },
        vfileDataIntoScope: 'toc',
    }

    const { content, scope } = await evaluate<Frontmatter, Scope>({
        source: target.content ?? '',
        options,
        components,
    })

    return (
        <ArticleContentLayout toc={scope.toc}>
            <div className="mdx-wrapper">
                <Suspense fallback={<LoadingComponent />}>{content}</Suspense>
            </div>
        </ArticleContentLayout>
    )
}
