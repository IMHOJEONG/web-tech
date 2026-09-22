import rehypeShiki from '@shikijs/rehype'
import type { MDXComponents } from 'mdx/types'
import { evaluate, type EvaluateOptions } from 'next-mdx-remote-client/rsc'
import type { ReactNode } from 'react'
import remarkGfm from 'remark-gfm'
import remarkFlexibleToc, { type TocItem } from 'remark-flexible-toc'
import { shikiRehypeOptions } from './shiki-options.js'
import { rehypeArticleTitle } from './rehype-article-title.ts'
import { normalizeRemoteArticleHtml } from '../widgets/article-detail/model/normalize-remote-article-html.ts'

type Scope = {
    readingTime: string
    toc?: TocItem[]
    hasTitle?: boolean
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
          hasTitle: boolean
          toc: TocItem[]
          content: string
      }
    | {
          mode: 'mdx'
          hasTitle: boolean
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
            remarkPlugins: [remarkGfm, remarkFlexibleToc],
            rehypePlugins: codeHighlight
                ? [rehypeArticleTitle, [rehypeShiki, shikiRehypeOptions]]
                : [rehypeArticleTitle],
        },
        parseFrontmatter: true,
        scope: {
            readingTime: '',
        },
        vfileDataIntoScope: ['toc', 'hasTitle'],
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
            hasTitle: /<h1(?:\s|>)/i.test(normalizedRemoteArticle.content),
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
        hasTitle: scope.hasTitle === true,
        toc: scope.toc,
        content,
    }
}
