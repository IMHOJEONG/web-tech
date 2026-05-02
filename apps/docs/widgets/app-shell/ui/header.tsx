import { cn } from '@web-tech/ui/lib/utils'
import Link from 'next/link'
import { Search } from '~/feature/search/ui/search'
import { ThemeToggle } from '~/feature/theme-toggle/ui/theme-toggle'
import { Brand } from '~/shared/ui/brand'
import MobileNavDrawer from './mobile-nav-drawer'
import { Navigation } from './navigation'

export default function Header() {
    return (
        <header
            className={cn(
                'sticky top-0 z-50 w-full border-b border-white/10 bg-[#09090b]/80 text-white backdrop-blur-[12px]',
                'h-[4.0625rem]'
            )}
        >
            <div className="relative mx-auto flex h-16 w-full max-w-page items-center justify-between px-4 sm:px-6 md:px-8">
                <MobileNavDrawer />

                <div className="hidden min-w-0 flex-1 items-center justify-start sm:flex">
                    <Link
                        className="font-display flex items-center text-[1.25rem] leading-7 font-bold tracking-[0.1em] text-cyan-400 uppercase"
                        href="/"
                    >
                        <Brand />
                    </Link>
                </div>

                <div className="hidden sm:absolute sm:left-1/2 sm:flex sm:-translate-x-1/2 sm:items-center sm:justify-center">
                    <Navigation />
                </div>

                <div className="flex min-w-0 items-center justify-end sm:flex-1">
                    <div className="flex shrink-0 items-center gap-4 sm:gap-5 md:gap-6">
                        <Search />
                        <div className="hidden sm:block">
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}
