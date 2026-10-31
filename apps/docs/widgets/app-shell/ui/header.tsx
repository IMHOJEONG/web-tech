import { Suspense } from 'react'
import { Link } from '~/shared/i18n/navigation'
import { Search } from '~/feature/search/ui/search'
import { ThemeToggle } from '~/feature/theme-toggle/ui/theme-toggle'
import { Brand } from '~/shared/ui/brand'
import MobileNavDrawer from './mobile-nav-drawer'
import { Navigation } from './navigation'
import { LocaleSwitcher } from './locale-switcher'
import { HeaderFrame } from './header-frame'

export default function Header() {
    return (
        <HeaderFrame>
            <Suspense fallback={<div aria-hidden="true" className="h-16" />}>
                <HeaderContent />
            </Suspense>
        </HeaderFrame>
    )
}

function HeaderContent() {
    return (
        <div className="mx-auto grid min-h-16 w-full max-w-6xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-[min(1rem,16px)] py-2 sm:px-6 md:gap-x-4 md:px-8">
            <MobileNavDrawer />

            <div className="hidden min-w-0 items-center justify-start sm:flex">
                <Link
                    className="ds-focus-ring font-display inline-flex min-h-11 shrink-0 items-center rounded-md text-lg font-bold tracking-tight text-primary"
                    href="/"
                >
                    <Brand />
                </Link>
            </div>

            <div className="hidden min-w-0 sm:flex sm:items-center sm:justify-center">
                <Navigation />
            </div>

            <div className="col-start-3 flex min-w-0 items-center justify-end @max-[20rem]/shell:col-span-2 @max-[20rem]/shell:col-start-2 @max-[20rem]/shell:row-start-2">
                <div className="flex shrink-0 items-center gap-1 lg:gap-2">
                    <Search />
                    <LocaleSwitcher />
                    <div className="hidden md:block">
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </div>
    )
}
