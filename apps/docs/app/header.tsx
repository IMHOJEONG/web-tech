import { cn } from '@web-tech/ui/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { HEADER_HEIGHT } from '~/shared/constants'
import { Navigation } from '~/shared/navigation'
import { Search } from '~/shared/search'
import { ThemeToggle } from '~/shared/theme-toggle'

function Icon() {
    return (
        <Link className="flex items-center gap-2" href="/">
            <div className={`w-20 ${HEADER_HEIGHT} relative`}>
                <Image
                    src={'/logo.webp'}
                    alt=""
                    width={100}
                    height={100}
                    priority
                    placeholder="blur"
                    blurDataURL="/image/blur-image.webp"
                    className="items-center flex size-full"
                />
            </div>
        </Link>
    )
}

export default function Header() {
    return (
        <header
            className={cn(
                'sticky top-0 z-50 w-full border-b border-header-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-border',
                'bg-blue-100 text-black',
                `dark:bg-[var(--hf-bg-dark)]
                    border-b
                    border-[var(--hf-surface-border)]
                dark:text-[var(--hf-text-primary)]
                    backdrop-blur-[6px]`
            )}
        >
            <div className={`flex ${HEADER_HEIGHT} items-center px-4`}>
                <div className="flex size-full items-center justify-stretch gap-2">
                    <div className="flex size-full items-center justify-stretch gap-4">
                        <Icon />
                        <Navigation />
                    </div>
                    <ThemeToggle />
                    <Search />
                </div>
            </div>
        </header>
    )
}
