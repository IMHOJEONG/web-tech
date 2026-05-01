'use client'
import { cn } from '@web-tech/ui/lib/utils'
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
                                'font-display relative inline-flex h-6 items-center text-base font-normal leading-6 tracking-[-0.025em] transition-colors after:absolute after:-bottom-1.5 after:left-1/2 after:h-0.5 after:w-full after:-translate-x-1/2 after:rounded-full after:transition-colors',
                                isActive
                                    ? 'text-cyan-400 after:bg-cyan-400'
                                    : 'text-zinc-400 after:bg-transparent hover:text-zinc-200'
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
