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
                'grid grid-cols-1 md:grid-cols-[0.4fr_0.6fr]',
                'grid-cols-[0.3fr_0.7fr]',

                'gap-3 rounded-lg',
                'justify-between'
            )}
        >
            <div className="aspect-square w-full overflow-hidden rounded-lg">
                <Image
                    src={'/default/no-image.webp'}
                    alt={title ?? ''}
                    width={1920}
                    height={1920}
                    className="rounded-lg size-full"
                />
            </div>
            <div className="flex flex-col justify-between gap-1 text-wrap">
                <div className="line-clamp-2">{title}</div>
                {summary && <div className="line-clamp-3">{summary}</div>}
                <div>{getTime(date ?? '')}</div>
            </div>
        </div>
    )
}

export default MainCard
