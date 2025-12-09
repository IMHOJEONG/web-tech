import { MDXRemote, MDXRemoteOptions } from 'next-mdx-remote-client/rsc'
import { getDocsData } from '~/lib/util'
import { components } from '~/mdx-components'

export default async function Page({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const data = await getDocsData()
    const target = data.find((doc) => doc.slug == slug)
    console.log(slug, target?.fileName)

    const options: MDXRemoteOptions = {
        mdxOptions: {
            // ...
        },
        parseFrontmatter: true,
        // scope: {
        //     readingTime: calculateSomeHow(source),
        // },
    }
    return (
        <MDXRemote
            source={target?.content ?? ''}
            options={options}
            components={components}
            // onError={ErrorComponent}
        />
    )
}
