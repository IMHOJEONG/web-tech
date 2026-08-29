import { notFound, permanentRedirect } from 'next/navigation'
import { getDocHref } from '~/lib/get-doc-route'
import { getCategoryData } from '~/lib/get-category'

interface PagesProps {
    slug: string
    main: string
    sub: string
}

export default async function Page({
    params,
}: {
    params: Promise<PagesProps>
}) {
    const { slug, main, sub } = await params
    const data = await getCategoryData(main, sub)
    const target = data.find((doc) => doc.slug === slug)

    if (!target) {
        notFound()
    }

    permanentRedirect(getDocHref(target))
}
