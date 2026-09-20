'use client'
import { cn } from '@web-tech/ui/lib/utils'
import { useTranslations } from 'next-intl'
import { Link } from '~/shared/i18n/navigation'
import { usePathname } from '~/shared/i18n/navigation'

const navigation = [
    {
        href: '/feed',
        key: 'feed',
        activePrefixes: ['/feed', '/docs'],
    },
    {
        href: '/web',
        key: 'web',
        activePrefixes: ['/web', '/category/fe'],
    },
    {
        href: '/mobile',
        key: 'mobile',
        activePrefixes: ['/mobile'],
    },
    {
        href: '/ui-ux',
        key: 'uiux',
        activePrefixes: ['/ui-ux'],
    },
    {
        href: '/about',
        key: 'about',
        activePrefixes: ['/about'],
    },
]

export const Navigation = () => {
    const pathname = usePathname()
    const t = useTranslations('navigation')

    return (
        <div
            data-testid="desktop-navigation"
            className="hidden min-w-0 items-center gap-1 sm:flex lg:gap-2"
        >
            {navigation.map((nav) => {
                const { href, key, activePrefixes } = nav
                const isActive = activePrefixes.some(
                    (prefix) =>
                        pathname === prefix ||
                        pathname?.startsWith(`${prefix}/`)
                )

                return (
                    <nav key={key} className="flex items-center">
                        <Link
                            className={cn(
                                'ds-focus-ring font-display relative inline-flex min-h-11 items-center whitespace-nowrap rounded-lg px-2 text-sm font-medium tracking-tight transition-colors after:absolute after:inset-x-2 after:bottom-1 after:h-0.5 after:rounded-full md:px-2.5 lg:px-3',
                                isActive
                                    ? 'bg-primary/10 text-primary after:bg-primary'
                                    : 'text-on-surface-variant after:bg-transparent hover:bg-surface-container-low hover:text-on-surface'
                            )}
                            href={href}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            {t(key)}
                        </Link>
                    </nav>
                )
            })}
        </div>
    )
}
