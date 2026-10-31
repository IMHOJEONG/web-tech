import { Link } from '~/shared/i18n/navigation'

type FoundationItem = {
    title: string
    description: string
    href: string
}

type ThematicFoundationsProps = {
    title: string
    items: FoundationItem[]
}

export function ThematicFoundations({
    title,
    items,
}: ThematicFoundationsProps) {
    return (
        <section
            data-testid="landing-topics"
            className="min-w-0 space-y-5 border-t border-border pt-8"
        >
            <h2 className="font-display text-xl font-semibold tracking-tight text-on-surface sm:text-2xl">
                {title}
            </h2>
            <nav
                aria-label={title}
                className="grid gap-3 sm:grid-cols-3 sm:gap-6"
            >
                {items.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="group ds-focus-ring block min-w-0 rounded-sm py-3"
                    >
                        <div className="space-y-2">
                            <h3 className="text-base font-semibold tracking-tight text-on-surface group-hover:text-[var(--docs-interactive-text)] group-focus-visible:text-[var(--docs-interactive-text)]">
                                {item.title}
                            </h3>
                            <p className="text-sm leading-7 text-on-surface-variant">
                                {item.description}
                            </p>
                        </div>
                    </Link>
                ))}
            </nav>
        </section>
    )
}
