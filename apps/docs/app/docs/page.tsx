import { cn } from '@web-tech/ui/lib/utils'
import Link from 'next/link'
import MainCard from '~/components/main-card'
import { getSortedPostsData } from '~/lib/get-document'

export default async function Page() {
    const data = await getSortedPostsData()
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
