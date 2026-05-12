import { evaluate, EvaluateOptions } from 'next-mdx-remote-client/rsc'
import { Suspense } from 'react'
import rehypeShiki from '@shikijs/rehype'
import remarkFlexibleToc, { TocItem } from 'remark-flexible-toc'
import { shikiRehypeOptions } from '~/lib/shiki-options.js'
import { getCategoryData } from '~/lib/get-category'
import { components } from '~/mdx-components'
import { LoadingComponent } from '~/shared/loading-component'

type Scope = {
    readingTime: string
    toc?: TocItem[]
}

type Frontmatter = {
    title: string
    author: string
}

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
    const target = data.find((doc) => doc.slug == slug)
    console.log(slug, main, sub, target?.fileName, data)

    const options: EvaluateOptions<Scope> = {
        mdxOptions: {
            remarkPlugins: [remarkFlexibleToc],
            rehypePlugins: [[rehypeShiki, shikiRehypeOptions]],
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

    console.log(content)

    return (
        <div className="flex gap-4">
            <div className="flex-1">
                <Suspense fallback={<LoadingComponent />}>{content}</Suspense>
            </div>
        </div>
    )
}
