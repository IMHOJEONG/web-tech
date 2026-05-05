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
    FileText,
    LogOut,
    Newspaper,
    Settings,
    Users,
    X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Brand } from '~/shared/ui/brand'

const drawerLinks = [
    {
        href: '/feed',
        label: 'Latest Articles',
        icon: Newspaper,
        activePrefixes: ['/feed', '/docs'],
    },
    {
        href: '/web',
        label: 'Tutorials',
        icon: BookOpenText,
        activePrefixes: ['/web', '/mobile', '/platform'],
    },
    {
        href: '/ui-ux',
        label: 'Code Snippets',
        icon: Braces,
        activePrefixes: ['/ui-ux'],
    },
    {
        href: '/docs',
        label: 'Documentation',
        icon: FileText,
        activePrefixes: ['/docs'],
    },
    {
        href: '/about',
        label: 'Community',
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
                'flex w-full items-center gap-3 px-6 py-4 text-[0.875rem] tracking-[0.05em] transition-colors',
                isActive
                    ? 'border-r-2 border-cyan-400 bg-cyan-500/10 text-cyan-400'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
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

    useEffect(() => {
        setOpen(false)
    }, [pathname])

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <div className="flex items-center gap-3 sm:hidden">
                <SheetTrigger
                    aria-label="Open navigation drawer"
                    className="flex h-7 w-[2.125rem] items-center justify-center text-zinc-300 transition-colors hover:text-cyan-400"
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
                    className="font-display flex items-center text-[1.25rem] font-bold leading-7 tracking-[-0.05em] text-cyan-400"
                    href="/"
                >
                    <Brand />
                </Link>
            </div>

            <SheetContent
                side="left"
                className="z-[70] flex w-80 max-w-[85vw] flex-col gap-0 border-r border-white/5 bg-[#18181b] p-0 text-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45)] [&>button]:hidden sm:hidden"
            >
                <SheetTitle className="sr-only">Navigation Drawer</SheetTitle>
                <SheetDescription className="sr-only">
                    Mobile navigation drawer for docs sections.
                </SheetDescription>

                <div className="flex items-center justify-between px-6 py-6">
                    <Link
                        className="font-display text-2xl font-bold text-cyan-400"
                        href="/"
                        onClick={() => setOpen(false)}
                    >
                        <Brand />
                    </Link>

                    <SheetClose
                        type="button"
                        aria-label="Close navigation drawer"
                        className="text-zinc-500 transition-colors hover:text-zinc-200"
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
                                    label={item.label}
                                    icon={item.icon}
                                    isActive={isActive}
                                    onNavigate={() => setOpen(false)}
                                />
                            )
                        })}
                    </div>

                    <div className="border-t border-white/5 px-6 pb-4 pt-[1.0625rem]">
                        <p className="font-display text-[0.625rem] tracking-[0.1em] text-zinc-500 uppercase">
                            Technical Stats
                        </p>

                        <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between text-[0.75rem] text-zinc-400">
                                <span className="font-display">
                                    System Integrity
                                </span>
                                <span className="font-display text-cyan-400">
                                    98%
                                </span>
                            </div>
                            <div className="h-1 w-full bg-zinc-800">
                                <div className="h-full w-[98%] bg-cyan-400 shadow-[0_0_8px_rgba(0,245,255,0.5)]" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/5 bg-black/20 px-6 pb-6 pt-6">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="flex size-12 items-center justify-center rounded-[0.25rem] border border-cyan-400/30 bg-zinc-900 text-sm font-semibold text-zinc-200">
                                D
                            </div>
                            <div className="absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-[#18181b] bg-cyan-400" />
                        </div>

                        <div>
                            <p className="font-display text-sm font-bold tracking-[-0.02em] text-on-surface">
                                DEV_PROTOCOL_01
                            </p>
                            <p className="font-mono text-[0.6875rem] text-zinc-500">
                                Senior Contributor
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-2">
                        <Link
                            href="/about"
                            onClick={() => setOpen(false)}
                            className="flex items-center justify-center gap-2 rounded-[0.125rem] bg-zinc-800 px-4 py-2.5 text-[0.75rem] text-zinc-300"
                        >
                            <Settings className="size-3.5" strokeWidth={1.8} />
                            <span className="font-display">Config</span>
                        </Link>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="flex items-center justify-center gap-2 rounded-[0.125rem] border border-cyan-400/20 bg-cyan-500/10 px-4 py-2.5 text-[0.75rem] text-cyan-400"
                        >
                            <LogOut className="size-3.5" strokeWidth={1.8} />
                            <span className="font-display">Exit</span>
                        </button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
