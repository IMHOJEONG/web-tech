import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

const footerLinks = [
    { href: '#', key: 'privacy' },
    { href: '#', key: 'terms' },
    { href: '#', key: 'changelog' },
    { href: '#', key: 'github' },
]

export default async function Footer() {
    const commonT = await getTranslations('common')
    const footerT = await getTranslations('footer')

    return (
        <footer className="relative z-20 w-full border-t border-zinc-900 bg-zinc-950 px-4 pt-[4.0625rem] pb-16 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-page flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                    <div className="font-display text-lg font-bold leading-7 tracking-[0.1em] text-zinc-100 uppercase">
                        {commonT('brand')}
                    </div>
                    <div className="font-display text-[0.625rem] leading-[0.9375rem] tracking-[0.2em] text-zinc-600 uppercase">
                        {footerT('tagline', {
                            year: '2024',
                            brand: commonT('brand'),
                        })}
                    </div>
                </div>

                <nav className="flex flex-wrap items-center gap-8 md:pb-1">
                    {footerLinks.map((link) => (
                        <Link
                            key={link.key}
                            href={link.href}
                            className="font-display text-[0.625rem] leading-[0.9375rem] tracking-[0.2em] text-zinc-600 uppercase transition-colors hover:text-zinc-400"
                        >
                            {footerT(`links.${link.key}`)}
                        </Link>
                    ))}
                </nav>
            </div>
        </footer>
    )
}
