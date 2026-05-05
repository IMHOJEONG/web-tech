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
        <div className="hidden min-w-0 items-center gap-3 sm:flex md:gap-5 lg:gap-8">
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
                                'font-display relative inline-flex h-6 items-center text-sm font-normal leading-6 tracking-tight transition-colors after:absolute after:-bottom-1.5 after:left-1/2 after:h-0.5 after:w-full after:-translate-x-1/2 after:rounded-full after:transition-colors md:text-[0.9375rem] lg:text-base',
                                isActive
                                    ? 'text-primary after:bg-primary'
                                    : 'text-muted-foreground after:bg-transparent hover:text-on-surface'
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
