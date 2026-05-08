import { evaluate, EvaluateOptions } from 'next-mdx-remote-client/rsc'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import remarkFlexibleToc, { TocItem } from 'remark-flexible-toc'
import { getDocBySlug } from '~/lib/get-document'
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
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const target = await getDocBySlug(slug)

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
        },
        parseFrontmatter: true,
        scope: {
            // readingTime: calculateSomeHow(source),
            readingTime: '',
        },
        vfileDataIntoScope: 'toc',
    }

    const { content, frontmatter, scope, error } = await evaluate<
        Frontmatter,
        Scope
    >({
        source: target?.content ?? '',
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
