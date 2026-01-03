'use client'
import { cn } from '@/lib/utils'
import Link from 'next/link'

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

export const Navigation = () => {
    return (
        <div className="flex items-center gap-5">
            {navigation.map((nav) => {
                const { href, name } = nav
                return (
                    <nav
                        key={name}
                        className="flex items-center gap-4 text-sm xl:gap-6"
                    >
                        <Link
                            className={cn(
                                'transition-colors hover:text-foreground/80 text-foreground/80',
                                'text-lg'
                            )}
                            href={href}
                        >
                            {name}
                        </Link>
                    </nav>
                )
            })}
        </div>
    )
}
