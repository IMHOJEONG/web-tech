import { getLocale, getTranslations } from 'next-intl/server'
import Link from 'next/link'
import {
    localizePath,
    isLocale,
    defaultLocale,
} from '~/shared/i18n/locale-path'
import { DOCS_GITHUB_REPO_URL } from '~/shared/config/external-links'

const footerLinks = [
    { href: '/privacy', key: 'privacy' },
    { href: '/terms', key: 'terms' },
    { href: '/changelog', key: 'changelog' },
    { href: DOCS_GITHUB_REPO_URL, key: 'github', external: true },
]

export default async function Footer() {
    const value = await getLocale()
    const locale = isLocale(value) ? value : defaultLocale
    const commonT = await getTranslations('common')
    const footerT = await getTranslations('footer')

    return (
        <footer className="relative z-20 w-full border-t border-header-border bg-surface-container-low px-4 pt-8 pb-24 sm:px-6 sm:pb-10 lg:px-8 lg:py-10">
            <div className="mx-auto flex max-w-page flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="font-display text-lg font-bold leading-7 tracking-[0.1em] text-on-surface uppercase">
                        {commonT('brand')}
                    </div>
                </div>

                <nav
                    aria-label={footerT('linksAriaLabel')}
                    data-testid="footer-utility-links"
                    className="hidden flex-wrap items-center gap-2 lg:flex"
                >
                    {footerLinks.map((link) => (
                        <Link
                            key={link.key}
                            href={localizePath(link.href, locale)}
                            target={link.external ? '_blank' : undefined}
                            rel={
                                link.external
                                    ? 'noreferrer noopener'
                                    : undefined
                            }
                            className="font-display inline-flex min-h-11 items-center px-2 text-xs tracking-[0.12em] text-muted-foreground uppercase transition-colors hover:text-on-surface"
                        >
                            {footerT(`links.${link.key}`)}
                        </Link>
                    ))}
                </nav>
            </div>
        </footer>
    )
}
