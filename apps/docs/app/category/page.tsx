import { cn } from '@web-tech/ui/lib/utils'
import { getSortedPostsData } from '~/lib/get-document'

export default async function Page() {
    const data = await getSortedPostsData()
    return <div className={cn()}>test</div>
}
