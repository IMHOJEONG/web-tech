import Link from 'next/link'
import { Search } from '~/feature/search/ui/search'
import { ThemeToggle } from '~/feature/theme-toggle/ui/theme-toggle'
import { Brand } from '~/shared/ui/brand'
import MobileNavDrawer from './mobile-nav-drawer'
import { Navigation } from './navigation'

export default function Header() {
    return (
        <header className="sticky top-0 z-50 h-16.25 w-full border-b border-header-border bg-background text-on-surface shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <div className="mx-auto flex h-16 w-full max-w-page items-center justify-between px-4 sm:grid sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-4 sm:px-6 md:gap-6 md:px-8">
                <MobileNavDrawer />

                <div className="hidden min-w-0 items-center justify-start sm:flex">
                    <Link
                        className="font-display flex items-center text-xl font-bold leading-7 tracking-widest text-primary uppercase"
                        href="/"
                    >
                        <Brand />
                    </Link>
                </div>

                <div className="hidden min-w-0 sm:flex sm:items-center sm:justify-center">
                    <Navigation />
                </div>

                <div className="flex min-w-0 items-center justify-end">
                    <div className="flex shrink-0 items-center gap-3 sm:gap-4 md:gap-5">
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
