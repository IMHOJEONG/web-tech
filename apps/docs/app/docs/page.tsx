import Link from 'next/link'
import MainCard from '~/components/main-card'
import { getSortedPostsData } from '~/lib/util'

export default async function Page() {
    const data = await getSortedPostsData()
    return (
        <div className="flex flex-col gap-3 p-3 sm:grid sm:grid-cols-4">
            {data.map((doc) => {
                const { title, slug, id } = doc
                if (!slug) {
                    return null
                }
                return (
                    <Link href={`/${slug}`} key={id} className=" size-full">
                        <MainCard doc={doc} />
                    </Link>
                )
            })}
        </div>
    )
}
