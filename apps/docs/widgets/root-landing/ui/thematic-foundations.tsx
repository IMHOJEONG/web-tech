import Link from 'next/link'

type FoundationItem = {
    area: string
    title: string
    description: string
    href: string
}

type ThematicFoundationsProps = {
    eyebrow: string
    title: string
    countLabel: string
    items: FoundationItem[]
}

export function ThematicFoundations({
    eyebrow,
    title,
    countLabel,
    items,
}: ThematicFoundationsProps) {
    return (
        <section className="border-b border-outline-variant/70">
            <div className="mx-auto w-full max-w-page px-4 py-12 sm:px-6 sm:py-16 md:px-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-3">
                        <p className="text-xs font-semibold tracking-[0.2em] text-outline uppercase">
                            {eyebrow}
                        </p>
                        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-on-surface sm:text-4xl">
                            {title}
                        </h2>
                    </div>
                    <p className="text-sm font-medium tracking-[0.18em] text-outline uppercase">
                        {countLabel}
                    </p>
                </div>

                <div className="ds-panel mt-8 overflow-hidden p-0">
                    <div className="grid divide-y divide-outline-variant/70 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
                        {items.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="group flex min-h-72 flex-col justify-between px-6 py-8 transition-colors hover:bg-surface-container-low/50"
                            >
                                <div className="space-y-5">
                                    <p className="text-xs font-semibold tracking-[0.18em] text-outline uppercase">
                                        {item.area}
                                    </p>
                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-semibold tracking-[-0.03em] text-on-surface transition-colors group-hover:text-primary">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm leading-7 text-on-surface-variant">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                                <span className="mt-10 inline-block h-px w-10 bg-primary transition-all group-hover:w-16" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
