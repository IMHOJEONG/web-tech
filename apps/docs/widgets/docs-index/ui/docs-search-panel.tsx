import { useLocale, useTranslations } from 'next-intl'
import { DocumentSearchForm } from '~/feature/search/ui/document-search-form'
import { JournalPageHeader } from '~/shared/ui/journal-page-header'
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
        <section className="motion-layout max-w-full">
            <JournalPageHeader
                eyebrow={eyebrow}
                title={title}
                trailing={
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
                }
            />
        </section>
    )
}
