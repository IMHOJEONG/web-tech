import { notFound } from 'next/navigation'
import { getCategoryData } from '~/lib/get-category'
import { renderArticleContent } from '~/lib/render-article-content'
import { components } from '~/mdx-components'
import { ArticleContentLayout } from '~/widgets/article-detail/ui/article-content-layout'

interface PagesProps {
    slug: string
    main: string
    sub: string
}

export default async function Page({
    params,
}: {
    params: Promise<PagesProps>
}) {
    const { slug, main, sub } = await params
    const data = await getCategoryData(main, sub)
    const target = data.find((doc) => doc.slug === slug)

    if (!target) {
        notFound()
    }

    const renderedArticle = await renderArticleContent(target, {
        codeHighlight: false,
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
            <div className="mdx-wrapper">{renderedArticle.content}</div>
        </ArticleContentLayout>
    )
}
