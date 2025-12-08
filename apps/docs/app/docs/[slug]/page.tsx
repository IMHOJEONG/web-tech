import { PropsWithChildren } from 'react'
import { getDocsData } from '~/lib/util'
import CodeBlock from './codeblock'

const components = {
    // pre: (props: PropsWithChildren<{ className?: string }>) => {
    //   const { className, children } = props;
    //   return <pre className="not-prose">{children}</pre>;
    // },
    pre: (props: PropsWithChildren<{ className?: string }>) => {
        const { className, children } = props

        return <CodeBlock className={className}>{children}</CodeBlock>
    },
}

// export function generateStaticParams() {
//     return [{ slug: 'welcome' }, { slug: 'about' }]
// }

// export const dynamicParams = false

export default async function Page({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const data = await getDocsData()
    const target = data.find((doc) => doc.slug == slug)
    console.log(slug, target?.fileName)
    const { default: Post } = await import(`~/${target?.fileName}.mdx`)

    return <Post />
}
