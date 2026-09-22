import { getLocale, getTranslations } from 'next-intl/server'

// The real root layout supplies html lang and metadata for this temporary page.
export default async function Page() {
    const locale = await getLocale()
    const t = await getTranslations('metadata.site')
    return (
        <main>
            <h1 data-locale-probe={locale}>{t('title')}</h1>
            <p>{t('description')}</p>
        </main>
    )
}
