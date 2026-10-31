import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '~/shared/i18n/navigation'
import { journalEyebrow } from '~/shared/ui/journal-layout'

const topics = [
    { key: 'web', href: '/web' },
    { key: 'backend', href: '/docs?section=backend' },
    { key: 'uiux', href: '/ui-ux' },
] as const

export function FeedContentLayout({ children }: { children: ReactNode }) {
    const t = useTranslations('feedDiscovery')

    return (
        <div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1fr)_12rem] lg:gap-12">
            <div className="min-w-0">{children}</div>
            <aside
                aria-label={t('title')}
                className="min-w-0 border-t border-border pt-6 lg:border-t-0 lg:pt-0"
            >
                <h2 className={journalEyebrow}>{t('title')}</h2>
                <nav className="mt-3 divide-y divide-border">
                    {topics.map(({ key, href }) => (
                        <Link
                            key={key}
                            href={href}
                            className="ds-focus-ring block rounded-sm py-4 text-sm font-medium text-on-surface hover:text-[var(--docs-interactive-text)]"
                        >
                            {t(`topics.${key}.title`)}
                            <span className="mt-1 block text-xs font-normal text-on-surface-variant">
                                {t(`topics.${key}.description`)}
                            </span>
                        </Link>
                    ))}
                </nav>
                <Link
                    href="/docs"
                    className="ds-focus-ring mt-4 inline-flex min-h-11 items-center rounded-sm text-sm text-[var(--docs-interactive-text)] underline underline-offset-4"
                >
                    {t('browse')}
                </Link>
            </aside>
        </div>
    )
}
