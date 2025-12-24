import { cn } from '@web-tech/ui/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { HEADER_HEIGHT } from '~/shared/constants'
import { Search } from '~/shared/search'

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
                    className="items-center flex size-full"
                />
            </div>
            <span className={cn('font-bold text-center')}>Heap Forge</span>
        </Link>
    )
}

const navigation = [
    {
        href: '/docs',
        name: 'Documents',
    },
    {
        href: '/category',
        name: 'category',
    },
]

export default function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-header-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-border">
            <div className={`flex ${HEADER_HEIGHT} items-center px-4`}>
                <div className="flex size-full items-center justify-stretch">
                    <div className="flex size-full items-center justify-stretch gap-4">
                        <Icon />
                        <div className="flex items-center gap-5">
                            {navigation.map((nav) => {
                                const { href, name } = nav
                                return (
                                    <nav
                                        key={name}
                                        className="flex items-center gap-4 text-sm xl:gap-6"
                                    >
                                        <Link
                                            className="transition-colors hover:text-foreground/80 text-foreground/80"
                                            href={href}
                                        >
                                            {name}
                                        </Link>
                                    </nav>
                                )
                            })}
                        </div>
                    </div>
                    <Search />
                </div>
            </div>
        </header>
    )
}
