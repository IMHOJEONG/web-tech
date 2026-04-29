'use client'

import { cn } from '@/lib/utils'
import { House, Monitor, Smartphone, UserRound } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const mobileNav = [
    {
        href: '/feed',
        label: 'Feed',
        icon: House,
        activePrefixes: ['/feed', '/docs'],
    },
    {
        href: '/web',
        label: 'Web',
        icon: Monitor,
        activePrefixes: ['/web', '/category/fe'],
    },
    {
        href: '/mobile',
        label: 'Mobile',
        icon: Smartphone,
        activePrefixes: ['/mobile'],
    },
    {
        href: '/about',
        label: 'About',
        icon: UserRound,
        activePrefixes: ['/about'],
    },
]

export default function MobileBottomNav() {
    const pathname = usePathname()

    return (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#09090b]/90 backdrop-blur-[6px] md:hidden">
            <div className="grid h-[4.0625rem] grid-cols-4 items-center px-6">
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
                            aria-label={item.label}
                            className={cn(
                                'flex items-center justify-center text-zinc-500 transition-colors',
                                isActive &&
                                    'text-cyan-400 drop-shadow-[0_0_4px_rgba(0,245,255,0.5)]'
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
