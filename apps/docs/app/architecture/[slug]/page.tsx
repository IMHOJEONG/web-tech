import { evaluate, EvaluateOptions } from 'next-mdx-remote-client/rsc'
import { Suspense } from 'react'
import remarkFlexibleToc, { TocItem } from 'remark-flexible-toc' // <---------
import { getArchitecturesData } from '~/lib/get-architecture'
import { components } from '~/mdx-components'
import { LoadingComponent } from '~/shared/loading-component'
import Toc from '~/shared/toc'

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
    const data = await getArchitecturesData()
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
    return (
        <div className="flex gap-4">
            <div className="sticky top-24 h-fit">
                <Toc toc={scope.toc} />
            </div>

            <div className="flex-1">
                <Suspense fallback={<LoadingComponent />}>{content}</Suspense>
            </div>
        </div>
    )
}
