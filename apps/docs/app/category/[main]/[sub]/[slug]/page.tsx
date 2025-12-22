import { evaluate, EvaluateOptions } from 'next-mdx-remote-client/rsc'
import { Suspense } from 'react'
import remarkFlexibleToc, { TocItem } from 'remark-flexible-toc'
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

export default async function Page({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const data = await getCategoryData()
    const target = data.find((doc) => doc.slug == slug)
    console.log(slug, target?.fileName)

    const options: EvaluateOptions<Scope> = {
        mdxOptions: {
            // ...

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

    console.log(content)

    return (
        <div className="flex gap-4">
            <div className="flex-1">
                <Suspense fallback={<LoadingComponent />}>{content}</Suspense>
            </div>
        </div>
    )
}
