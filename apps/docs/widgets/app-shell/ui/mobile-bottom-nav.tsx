'use client'

import { cn } from '@web-tech/ui/lib/utils'
import { Braces, House, Monitor, Smartphone, UserRound } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const mobileNav = [
    {
        href: '/feed',
        key: 'feed',
        icon: House,
        activePrefixes: ['/feed', '/docs'],
    },
    {
        href: '/web',
        key: 'web',
        icon: Monitor,
        activePrefixes: ['/web', '/category/fe'],
    },
    {
        href: '/mobile',
        key: 'mobile',
        icon: Smartphone,
        activePrefixes: ['/mobile'],
    },
    {
        href: '/ui-ux',
        key: 'uiux',
        icon: Braces,
        activePrefixes: ['/ui-ux'],
    },
    {
        href: '/about',
        key: 'about',
        icon: UserRound,
        activePrefixes: ['/about'],
    },
]

export default function MobileBottomNav() {
    const pathname = usePathname()
    const t = useTranslations('navigation')

    return (
        <nav
            aria-label={t('mobileAriaLabel')}
            data-testid="mobile-bottom-nav"
            className="fixed inset-x-0 bottom-0 z-50 border-t border-header-border bg-popover/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-[10px] sm:hidden"
        >
            <div className="grid min-h-16.25 grid-cols-5 items-center gap-1 px-3">
                {mobileNav.map((item) => {
                    const isActive = item.activePrefixes.some(
                        (prefix) =>
                            pathname === prefix ||
                            pathname?.startsWith(`${prefix}/`)
                    )

                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={isActive ? 'page' : undefined}
                            aria-label={t(item.key)}
                            className={cn(
                                'ds-focus-ring flex min-h-12 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-container-low hover:text-on-surface',
                                isActive &&
                                    'bg-primary/10 text-primary shadow-glow-primary'
                            )}
                        >
                            <Icon
                                className="size-[1.05rem]"
                                strokeWidth={1.8}
                            />
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
