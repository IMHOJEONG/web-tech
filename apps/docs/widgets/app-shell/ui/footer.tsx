import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { DOCS_GITHUB_REPO_URL } from '~/shared/config/external-links'

const footerLinks = [
    { href: '/privacy', key: 'privacy' },
    { href: '/terms', key: 'terms' },
    { href: '/changelog', key: 'changelog' },
    { href: DOCS_GITHUB_REPO_URL, key: 'github', external: true },
]

export default async function Footer() {
    const commonT = await getTranslations('common')
    const footerT = await getTranslations('footer')

    return (
        <footer className="relative z-20 w-full border-t border-header-border bg-surface-container-low px-4 pt-10 pb-24 sm:px-6 sm:pt-12 sm:pb-12 lg:px-8 lg:pt-[4.0625rem] lg:pb-16">
            <div className="mx-auto flex max-w-page flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                    <div className="font-display text-lg font-bold leading-7 tracking-[0.1em] text-on-surface uppercase">
                        {commonT('brand')}
                    </div>
                    <div className="font-display text-[0.625rem] leading-[0.9375rem] tracking-[0.2em] text-muted-foreground uppercase">
                        {footerT('tagline', {
                            year: '2024',
                            brand: commonT('brand'),
                        })}
                    </div>
                </div>

                <nav
                    aria-label={footerT('linksAriaLabel')}
                    data-testid="footer-utility-links"
                    className="hidden flex-wrap items-center gap-8 lg:flex lg:pb-1"
                >
                    {footerLinks.map((link) => (
                        <Link
                            key={link.key}
                            href={link.href}
                            target={link.external ? '_blank' : undefined}
                            rel={
                                link.external
                                    ? 'noreferrer noopener'
                                    : undefined
                            }
                            className="font-display text-[0.625rem] leading-[0.9375rem] tracking-[0.2em] text-muted-foreground uppercase transition-colors hover:text-on-surface"
                        >
                            {footerT(`links.${link.key}`)}
                        </Link>
                    ))}
                </nav>
            </div>
        </footer>
    )
}
