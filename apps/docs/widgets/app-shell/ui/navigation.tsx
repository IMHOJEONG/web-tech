'use client'
import { cn } from '@web-tech/ui/lib/utils'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
        <div className="hidden items-center gap-6 sm:flex md:gap-8">
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
                                'font-display relative inline-flex h-6 items-center text-base font-normal leading-6 tracking-[-0.025em] transition-colors after:absolute after:-bottom-1.5 after:left-1/2 after:h-0.5 after:w-full after:-translate-x-1/2 after:rounded-full after:transition-colors',
                                isActive
                                    ? 'text-cyan-400 after:bg-cyan-400'
                                    : 'text-zinc-400 after:bg-transparent hover:text-zinc-200'
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
