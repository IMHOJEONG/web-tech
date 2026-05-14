import Image from 'next/image'
import Link from 'next/link'
import type { UiUxDoc } from './uiux-hub.types'

export function UiUxSmallArticleCard({
    eyebrow,
    doc,
    imageSrc,
}: {
    eyebrow: string
    doc: UiUxDoc
    imageSrc: string
}) {
    return (
        <Link
            href={doc.href}
            className="ds-card group flex h-full flex-col overflow-hidden bg-surface-container-lowest"
        >
            <div className="relative aspect-[16/9] overflow-hidden border-b border-outline-variant bg-surface-container-low">
                <Image
                    src={doc.thumbnail ?? imageSrc}
                    alt={doc.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
            </div>
            <div className="space-y-4 p-5">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-outline">
                    {eyebrow}
                </p>
                <h2 className="text-xl font-bold leading-tight tracking-[-0.03em] text-on-surface">
                    {doc.title}
                </h2>
                <p className="text-sm leading-6 text-on-surface-variant">
                    {doc.summary}
                </p>
            </div>
        </Link>
    )
}
