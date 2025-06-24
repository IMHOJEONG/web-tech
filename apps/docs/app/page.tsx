import { HeroSection } from '~/components/hero/hero-section'
import { getSortedPostsData } from '~/lib/util'

export default async function Page() {
    const data = await getSortedPostsData()
    return <HeroSection />
}
