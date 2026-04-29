import { cn } from '@web-tech/ui/lib/utils'
import Link from 'next/link'
import { Navigation } from '~/shared/navigation'
import { Search } from '~/shared/search'
import { ThemeToggle } from '~/shared/theme-toggle'

function Brand() {
    return (
        <Link
            className="font-display flex items-center text-[1.25rem] leading-7 font-bold tracking-[0.1em] text-cyan-400 uppercase"
            href="/"
        >
            TECH_LOGIC
        </Link>
    )
}

export default function Header() {
    return (
        <header
            className={cn(
                'sticky top-0 z-50 w-full border-b border-white/10 bg-[#09090b]/80 text-white backdrop-blur-[12px]',
                'h-[4.0625rem]'
            )}
        >
            <div className="mx-auto flex h-16 w-full max-w-page items-center px-4 sm:px-6 lg:px-8">
                <div className="flex min-w-0 flex-1 items-center justify-start">
                    <Brand />
                </div>

                <div className="flex shrink-0 items-center justify-center px-4">
                    <Navigation />
                </div>

                <div className="flex min-w-0 flex-1 items-center justify-end">
                    <div className="flex shrink-0 items-center gap-6">
                        <Search />
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </header>
    )
}
