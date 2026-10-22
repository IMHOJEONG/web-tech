import { useLocale, useTranslations } from 'next-intl'
import { DocumentSearchForm } from '~/feature/search/ui/document-search-form'
import {
    isLocale,
    defaultLocale,
    localizePath,
} from '~/shared/i18n/locale-path'

type DocsSearchPanelProps = {
    keyword?: string
    eyebrow: string
    title: string
    placeholder: string
    submitLabel: string
}

export function DocsSearchPanel({
    keyword,
    eyebrow,
    title,
    placeholder,
    submitLabel,
}: DocsSearchPanelProps) {
    const locale = useLocale()
    const t = useTranslations('common')
    return (
        <section className="motion-layout max-w-full rounded-xl border border-border bg-surface-container-lowest p-4 sm:p-5">
            <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)] lg:items-end">
                <div className="min-w-0 space-y-2">
                    <p className="text-xs font-semibold tracking-[0.2em] text-outline uppercase">
                        {eyebrow}
                    </p>
                    <h1 className="max-w-full break-keep text-2xl font-bold tracking-tight text-on-surface [overflow-wrap:anywhere] sm:text-3xl">
                        {title}
                    </h1>
                </div>

                <div className="min-w-0 space-y-3">
                    <DocumentSearchForm
                        key={keyword ?? ''}
                        keyword={keyword}
                        label={t('documentIndexSearch')}
                        action={localizePath(
                            '/docs',
                            isLocale(locale) ? locale : defaultLocale
                        )}
                        placeholder={placeholder}
                        submitLabel={submitLabel}
                    />
                </div>
            </div>
        </section>
    )
}
