import Link from 'next/link'

const footerLinks = [
    { href: '#', label: 'PRIVACY' },
    { href: '#', label: 'TERMS' },
    { href: '#', label: 'CHANGELOG' },
    { href: '#', label: 'GITHUB' },
]

export default function Footer() {
    return (
        <footer className="w-full border-t border-zinc-900 bg-[#09090b] px-4 pb-16 pt-[4.0625rem] sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-page flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                    <div className="font-display text-[1.125rem] leading-7 font-bold tracking-[0.1em] text-zinc-100 uppercase">
                        TECH_LOGIC
                    </div>
                    <div className="font-display text-[0.625rem] leading-[0.9375rem] tracking-[0.2em] text-zinc-600 uppercase">
                        {`© 2024 TECH_LOGIC // PRECISION ENGINEERED`}
                    </div>
                </div>

                <nav className="flex flex-wrap items-center gap-8 md:pb-1">
                    {footerLinks.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className="font-display text-[0.625rem] leading-[0.9375rem] tracking-[0.2em] text-zinc-600 uppercase transition-colors hover:text-zinc-400"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </footer>
    )
}
