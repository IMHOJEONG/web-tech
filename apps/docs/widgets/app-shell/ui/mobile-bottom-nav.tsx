'use client'

import { cn } from '@web-tech/ui/lib/utils'
import { Braces, House, Monitor, Smartphone, UserRound } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { Suspense } from 'react'
import Link from 'next/link'
import {
    localizePath,
    isLocale,
    defaultLocale,
} from '~/shared/i18n/locale-path'
import { usePathname } from '~/shared/i18n/navigation'
import { APP_NAVIGATION, getActiveNavigationKey } from '../model/app-navigation'

const mobileIcons = {
    feed: House,
    web: Monitor,
    mobile: Smartphone,
    uiux: Braces,
    about: UserRound,
}

export default function MobileBottomNav() {
    return (
        <Suspense fallback={<MobileNavItems />}>
            <ActiveMobileNav />
        </Suspense>
    )
}

function ActiveMobileNav() {
    const pathname = usePathname()
    return <MobileNavItems pathname={pathname} />
}

function MobileNavItems({ pathname = '' }: { pathname?: string }) {
    const activeKey = getActiveNavigationKey(pathname)
    const value = useLocale()
    const locale = isLocale(value) ? value : defaultLocale
    const t = useTranslations('navigation')

    return (
        <nav
            aria-label={t('mobileAriaLabel')}
            data-testid="mobile-bottom-nav"
            className="fixed inset-x-0 bottom-0 z-50 border-t border-header-border bg-popover/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-[10px] sm:hidden"
        >
            <div className="grid min-h-16.25 grid-cols-5 items-center gap-1 px-3">
                {APP_NAVIGATION.map((item) => {
                    const isActive = activeKey === item.key
                    const Icon = mobileIcons[item.key]

                    return (
                        <Link
                            key={item.href}
                            href={localizePath(item.href, locale)}
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
