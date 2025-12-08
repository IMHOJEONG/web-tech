import Link from 'next/link'
import MainCard from '~/components/main-card'
import { getSortedPostsData } from '~/lib/util'

export default async function Page() {
    const data = await getSortedPostsData()
    return (
        <div
            className="
        grid
        gap-4 p-4
        grid-cols-[repeat(auto-fit,minmax(260px,1fr))]
    "
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
