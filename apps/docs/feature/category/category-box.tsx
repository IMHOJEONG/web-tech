import Link from 'next/link'

interface CategoryBoxItem {
    slug?: string
    summary?: string
    thumbnail?: string | null
    title?: string
    date?: string
    fileName?: string
}

export const CategoryBox = ({ data }: { data: CategoryBoxItem }) => {
    const { summary, thumbnail, title, date, slug, fileName } = data

    console.log(slug)

    return (
        <Link className="flex flex-col" href={`/${fileName}`}>
            <div>{thumbnail}</div>
            <div>{summary}</div>
            <div>{title}</div>
            <div>{date}</div>
        </Link>
    )
}
