import { cn } from '@web-tech/ui/lib/utils'
import { Menu } from 'lucide-react'
import Link from 'next/link'
import { Search } from '~/feature/search'
import { ThemeToggle } from '~/feature/theme-toggle'
import { Navigation } from '~/shared/navigation'
import { Brand } from '../ui/brand'

export default function Header() {
    return (
        <header
            className={cn(
                'sticky top-0 z-50 w-full border-b border-white/10 bg-[#09090b]/80 text-white backdrop-blur-[12px]',
                'h-14 md:h-[4.0625rem]'
            )}
        >
            <div className="relative mx-auto flex h-full w-full max-w-page items-center justify-between px-4 md:h-16 md:px-8">
                <div className="flex items-center gap-3 md:hidden">
                    <Link
                        href="/feed"
                        aria-label="Go to feed"
                        className="flex h-7 w-[2.125rem] items-center justify-center text-zinc-300 transition-colors hover:text-cyan-400"
                    >
                        <Menu className="h-3 w-[1.125rem]" strokeWidth={2} />
                    </Link>

                    <Link
                        className="font-display flex items-center text-[1.25rem] leading-7 font-bold tracking-[-0.05em] text-cyan-400"
                        href="/"
                    >
                        <Brand />
                    </Link>
                </div>

                <div className="hidden min-w-0 flex-1 items-center justify-start md:flex">
                    <Link
                        className="font-display flex items-center text-[1.25rem] leading-7 font-bold tracking-[0.1em] text-cyan-400 uppercase"
                        href="/"
                    >
                        <Brand />
                    </Link>
                </div>

                <div className="hidden md:absolute md:left-1/2 md:flex md:-translate-x-1/2 md:items-center md:justify-center">
                    <Navigation />
                </div>

                <div className="flex min-w-0 items-center justify-end md:flex-1">
                    <div className="flex shrink-0 items-center gap-4 md:gap-6">
                        <Search />
                        <div className="hidden md:block">
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}
