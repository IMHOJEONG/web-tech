'use client'

import { cn } from '@web-tech/ui/lib/utils'
import { House, Monitor, Smartphone, UserRound } from 'lucide-react'
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
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-header-border bg-popover/90 backdrop-blur-[6px] sm:hidden">
            <div className="grid h-16.25 grid-cols-4 items-center px-6">
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
                                'flex items-center justify-center text-muted-foreground transition-colors',
                                isActive && 'text-primary shadow-glow-primary'
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
