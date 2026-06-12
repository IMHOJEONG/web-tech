'use client'

import {
    SheetClose,
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
    SheetTrigger,
} from '@web-tech/ui/components/sheet'
import { cn } from '@web-tech/ui/lib/utils'
import {
    BookOpenText,
    Braces,
    LogOut,
    Newspaper,
    Settings,
    Smartphone,
    Users,
    X,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Brand } from '~/shared/ui/brand'

const drawerLinks = [
    {
        href: '/feed',
        key: 'feed',
        icon: Newspaper,
        activePrefixes: ['/feed'],
    },
    {
        href: '/web',
        key: 'web',
        icon: BookOpenText,
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
        icon: Users,
        activePrefixes: ['/about'],
    },
] as const

function DrawerLink({
    href,
    label,
    icon: Icon,
    isActive,
    onNavigate,
}: {
    href: string
    label: string
    icon: typeof Newspaper
    isActive: boolean
    onNavigate: () => void
}) {
    return (
        <Link
            href={href}
            onClick={onNavigate}
            className={cn(
                'flex w-full items-center gap-3 px-6 py-4 text-sm tracking-[0.05em] transition-colors',
                isActive
                    ? 'border-r-2 border-primary bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-surface-container hover:text-on-surface'
            )}
        >
            <Icon className="size-4" strokeWidth={1.8} />
            <span className="font-display font-medium">{label}</span>
        </Link>
    )
}

export default function MobileNavDrawer() {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)
    const headerT = useTranslations('header')
    const navT = useTranslations('navigation')
    const aboutT = useTranslations('about')
    const statusChecks = [
        headerT('drawer.checks.navigation'),
        headerT('drawer.checks.search'),
        headerT('drawer.checks.content'),
    ]

    useEffect(() => {
        setOpen(false)
    }, [pathname])

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <div className="flex items-center gap-3 sm:hidden">
                <SheetTrigger
                    aria-label={headerT('drawer.openAriaLabel')}
                    className="flex h-7 w-[2.125rem] items-center justify-center text-muted-foreground transition-colors hover:text-primary"
                >
                    <svg
                        width="18"
                        height="12"
                        viewBox="0 0 18 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-[1.125rem]"
                    >
                        <path
                            d="M1 1H17M1 6H17M1 11H17"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                </SheetTrigger>
                <Link
                    className="font-display flex items-center text-xl font-bold leading-7 tracking-[-0.05em] text-primary"
                    href="/"
                >
                    <Brand />
                </Link>
            </div>

            <SheetContent
                side="left"
                className="z-[70] flex w-80 max-w-[85vw] flex-col gap-0 border-r border-header-border bg-popover p-0 text-on-surface shadow-deep [&>button]:hidden sm:hidden"
            >
                <SheetTitle className="sr-only">
                    {headerT('drawer.title')}
                </SheetTitle>
                <SheetDescription className="sr-only">
                    {headerT('drawer.description')}
                </SheetDescription>

                <div className="flex items-center justify-between px-6 py-6">
                    <Link
                        className="font-display text-2xl font-bold text-primary"
                        href="/"
                        onClick={() => setOpen(false)}
                    >
                        <Brand />
                    </Link>

                    <SheetClose
                        type="button"
                        aria-label={headerT('drawer.closeAriaLabel')}
                        className="text-muted-foreground transition-colors hover:text-on-surface"
                    >
                        <X className="size-4" strokeWidth={1.8} />
                    </SheetClose>
                </div>

                <div className="flex flex-1 flex-col overflow-y-auto">
                    <div className="py-4">
                        {drawerLinks.map((item) => {
                            const isActive = item.activePrefixes.some(
                                (prefix) =>
                                    pathname === prefix ||
                                    pathname?.startsWith(`${prefix}/`)
                            )

                            return (
                                <DrawerLink
                                    key={item.href}
                                    href={item.href}
                                    label={navT(item.key)}
                                    icon={item.icon}
                                    isActive={isActive}
                                    onNavigate={() => setOpen(false)}
                                />
                            )
                        })}
                    </div>

                    <div className="border-t border-header-border px-6 pb-4 pt-[1.0625rem]">
                        <p className="font-display text-[0.625rem] tracking-[0.1em] text-muted-foreground uppercase">
                            {headerT('drawer.statsLabel')}
                        </p>

                        <div className="mt-4 space-y-3">
                            {statusChecks.map((label) => (
                                <div
                                    key={label}
                                    className="flex items-center justify-between text-xs text-muted-foreground"
                                >
                                    <span className="font-display">
                                        {label}
                                    </span>
                                    <span className="font-display text-primary">
                                        {headerT('drawer.healthy')}
                                    </span>
                                </div>
                            ))}
                            <p className="text-[0.6875rem] leading-5 text-muted-foreground">
                                {headerT('drawer.criteriaHint')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-header-border bg-surface-container-low px-6 pb-6 pt-6">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="flex size-12 items-center justify-center rounded-sm border border-primary/30 bg-surface-container text-sm font-semibold text-on-surface">
                                HI
                            </div>
                            <div className="absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-popover bg-primary" />
                        </div>

                        <div>
                            <p className="font-display text-sm font-bold tracking-[-0.02em] text-on-surface">
                                {aboutT('profile.name')}
                            </p>
                            <p className="font-display text-[0.6875rem] tracking-[0.08em] text-muted-foreground uppercase">
                                {aboutT('profile.role')}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-2">
                        <Link
                            href="/about"
                            onClick={() => setOpen(false)}
                            className="flex items-center justify-center gap-2 rounded-xs bg-surface-container px-4 py-2.5 text-xs text-on-surface"
                        >
                            <Settings className="size-3.5" strokeWidth={1.8} />
                            <span className="font-display">
                                {headerT('drawer.config')}
                            </span>
                        </Link>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="flex items-center justify-center gap-2 rounded-xs border border-primary/20 bg-primary/10 px-4 py-2.5 text-xs text-primary"
                        >
                            <LogOut className="size-3.5" strokeWidth={1.8} />
                            <span className="font-display">
                                {headerT('drawer.exit')}
                            </span>
                        </button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
