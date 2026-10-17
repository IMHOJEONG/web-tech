import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocalDraftPreview } from '~/lib/local-draft-preview'
import { renderArticleContent } from '~/lib/render-article-content'
import { components } from '~/mdx-components'
import { ArticleContentLayout } from '~/widgets/article-detail/ui/article-content-layout'

export const metadata: Metadata = {
    title: '로컬 초안 미리보기 · HeapForge',
    robots: { index: false, follow: false },
}

export default async function DraftPreviewPage({
    params,
}: {
    params: Promise<{ slugParts: string[] }>
}) {
    const { slugParts } = await params
    const draft = getLocalDraftPreview(slugParts.join('/'))
    if (!draft) notFound()
    const rendered = await renderArticleContent(draft, {
        codeHighlight: false,
        components,
    })
    if (rendered.mode !== 'mdx') notFound()
    return (
        <div className="mdx-draft-preview">
            <ArticleContentLayout
                fallbackTitle={rendered.hasTitle ? undefined : draft.title}
                toc={rendered.toc}
            >
                <p className="mb-6 rounded-lg border border-outline-variant p-3 text-sm">
                    로컬 초안 미리보기 — 아직 게시되지 않은 글입니다.
                </p>
                <div className="mdx-wrapper">{rendered.content}</div>
            </ArticleContentLayout>
        </div>
    )
}
