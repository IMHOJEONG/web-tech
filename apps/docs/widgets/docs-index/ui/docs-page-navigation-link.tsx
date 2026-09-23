import { cn } from '@web-tech/ui/lib/utils'
import { Link } from '~/shared/i18n/navigation'

const baseClassName =
    'inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface-variant'

export function DocsPageNavigationLink({
    href,
    label,
}: {
    href?: string
    label: string
}) {
    if (!href) {
        return (
            <span
                role="link"
                aria-disabled="true"
                className={cn(baseClassName, 'cursor-not-allowed opacity-45')}
            >
                {label}
            </span>
        )
    }

    return (
        <Link
            href={href}
            data-touch-target="docs-index"
            className={cn(
                baseClassName,
                'ds-focus-ring transition hover:border-primary/50 hover:text-primary'
            )}
        >
            {label}
        </Link>
    )
}
