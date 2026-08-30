import rehypeShiki from '@shikijs/rehype'
import type { MDXComponents } from 'mdx/types'
import { evaluate, type EvaluateOptions } from 'next-mdx-remote-client/rsc'
import type { ReactNode } from 'react'
import remarkFlexibleToc, { type TocItem } from 'remark-flexible-toc'
import { shikiRehypeOptions } from './shiki-options.js'
import { normalizeRemoteArticleHtml } from '../widgets/article-detail/model/normalize-remote-article-html.ts'

type Scope = {
    readingTime: string
    toc?: TocItem[]
}

type Frontmatter = {
    title: string
    author: string
}

type RenderableArticle = {
    content?: string
    contentFormat?: 'mdx' | 'html'
}

export type RenderArticleContentResult =
    | {
          mode: 'html'
          toc: TocItem[]
          content: string
      }
    | {
          mode: 'mdx'
          toc?: TocItem[]
          content: ReactNode
      }

function createMdxEvaluateOptions({
    codeHighlight = true,
}: {
    codeHighlight?: boolean
} = {}): EvaluateOptions<Scope> {
    return {
        mdxOptions: {
            remarkPlugins: [remarkFlexibleToc],
            rehypePlugins: codeHighlight
                ? [[rehypeShiki, shikiRehypeOptions]]
                : [],
        },
        parseFrontmatter: true,
        scope: {
            readingTime: '',
        },
        vfileDataIntoScope: 'toc',
    }
}

export async function renderArticleContent(
    article: RenderableArticle,
    options: {
        codeHighlight?: boolean
        components?: MDXComponents
    } = {}
): Promise<RenderArticleContentResult> {
    if (article.contentFormat === 'html') {
        const normalizedRemoteArticle = normalizeRemoteArticleHtml(
            article.content ?? ''
        )

        return {
            mode: 'html',
            toc: normalizedRemoteArticle.toc,
            content: normalizedRemoteArticle.content,
        }
    }

    const { content, scope } = await evaluate<Frontmatter, Scope>({
        source: article.content ?? '',
        options: createMdxEvaluateOptions({
            codeHighlight: options.codeHighlight,
        }),
        components: options.components,
    })

    return {
        mode: 'mdx',
        toc: scope.toc,
        content,
    }
}
