import { Metadata } from '~/lib/util'
import Image from 'next/image'
import { getTime } from '@web-tech/ui/lib/time'

const MainCard = ({ doc }: { doc: Partial<Metadata> }) => {
    const { title, date, summary, slug, content } = doc
    return (
        <div className="size-full grid grid-cols-[200px_minmax(900px,_1fr)_100px] gap-3 p-3 rounded-lg">
            <div className="object-cover size-full">
                <Image
                    src={'/default/no-image.webp'}
                    alt={title ?? ''}
                    width={1920}
                    height={1920}
                    className="rounded-lg size-full aspect-video"
                />
            </div>
            <div>
            <div className="text-wrap text-ellipsis">{title}</div>
            {summary && <div className="text- wrap">{summary}</div>}
            {/* <div>{date}</div> */}
            <div>{getTime(date ?? '')}</div>
            </div>
        </div>
    )
}

export default MainCard
