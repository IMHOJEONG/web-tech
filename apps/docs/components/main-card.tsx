import { getTime } from '@web-tech/ui/lib/time'
import { cn } from '@web-tech/ui/lib/utils'
import Image from 'next/image'
import { Metadata } from '~/lib/util'

const MainCard = ({ doc }: { doc: Partial<Metadata> }) => {
    const { title, date, summary, slug, content } = doc
    return (
        <div
            className={cn(
                'size-full',
                'flex flex-col gap-3 rounded-lg',
                'justify-between'
            )}
        >
            <div className="object-cover">
                <Image
                    src={'/default/no-image.webp'}
                    alt={title ?? ''}
                    width={1920}
                    height={1920}
                    className="rounded-lg size-full"
                />
            </div>
            <div
                className={cn(
                    'size-full',
                    'flex flex-col gap-10 justify-between',
                    'text-wrap'
                )}
            >
                <div className="text-ellipsis">{title}</div>
                {summary && <div>{summary}</div>}
                <div>{getTime(date ?? '')}</div>
            </div>
        </div>
    )
}

export default MainCard
