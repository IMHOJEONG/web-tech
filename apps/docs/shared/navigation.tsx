'use client'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
    {
        href: '/feed',
        name: 'Feed',
        activePrefixes: ['/feed', '/docs'],
    },
    {
        href: '/web',
        name: 'Web',
        activePrefixes: ['/web', '/category/fe'],
    },
    {
        href: '/mobile',
        name: 'Mobile',
        activePrefixes: ['/mobile'],
    },
    {
        href: '/ui-ux',
        name: 'UI/UX',
        activePrefixes: ['/ui-ux'],
    },
    {
        href: '/about',
        name: 'About',
        activePrefixes: ['/about'],
    },
]

export const Navigation = () => {
    const pathname = usePathname()

    return (
        <div className="hidden items-center gap-8 md:flex">
            {navigation.map((nav) => {
                const { href, name, activePrefixes } = nav
                const isActive = activePrefixes.some(
                    (prefix) =>
                        pathname === prefix ||
                        pathname?.startsWith(`${prefix}/`)
                )

                return (
                    <nav key={name} className="flex items-center">
                        <Link
                            className={cn(
                                'font-display flex h-[1.875rem] items-center border-b-2 pb-[0.375rem] text-base font-normal leading-6 tracking-[-0.025em] transition-colors',
                                isActive
                                    ? 'border-cyan-400 text-cyan-400'
                                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                            )}
                            href={href}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            {name}
                        </Link>
                    </nav>
                )
            })}
        </div>
    )
}
