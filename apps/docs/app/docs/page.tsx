import { cn } from '@web-tech/ui/lib/utils'
import Link from 'next/link'
import { MainCard } from '~/entities/document'
import { EmptyAllDocs } from '~/feature/search/empty-all-docs'
import { EmptySearchResult } from '~/feature/search/empty-search-result'
import { getSortedPostsData } from '~/lib/get-document'
import { getSearchData } from '~/lib/get-search-data'
import { MainFeed } from '~/widgets/main-feed'

type Props = {
    searchParams: { q?: string }
}

export default async function Page({ searchParams }: Props) {
    const { q } = await searchParams
    console.log('KEYWORD : ', q)
    const data = q ? await getSearchData(q) : await getSortedPostsData()

    if (!q && data.length === 0) {
        return <EmptyAllDocs />
    }

    if (q && data.length === 0) {
        return <EmptySearchResult keyword={q} />
    }

    if (!q) {
        return <MainFeed docs={data} />
    }

    return (
        <div
            className={cn(
                'w-full max-w-[720px] mx-auto',
                'grid gap-4 p-4',
                'md:grid-cols-1',
                'grid-cols-[repeat(auto-fit,minmax(260px,1fr))]'
            )}
        >
            {data.map((doc) => {
                const { title, slug, id } = doc
                if (!slug) {
                    return null
                }
                return (
                    <Link
                        href={`/docs/${slug}`}
                        key={id}
                        className=" size-full"
                    >
                        <MainCard doc={doc} />
                    </Link>
                )
            })}
        </div>
    )
}
