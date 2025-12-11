import { cn } from '@web-tech/ui/lib/utils'
import Link from 'next/link'
import { ArchitectureCard } from '~/components/architecture/architecture-card'
import { getArchitecturesData } from '~/lib/get-architecture'

export default async function Page() {
    const data = await getArchitecturesData()
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
                        href={`/architecture/${slug}`}
                        key={id}
                        className=" size-full"
                    >
                        <ArchitectureCard doc={doc} />
                    </Link>
                )
            })}
        </div>
    )
}
