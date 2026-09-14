import { getRequestConfig } from 'next-intl/server'
import * as rootParams from 'next/root-params'
import { notFound } from 'next/navigation'
import { isLocale } from '~/shared/i18n/locale-path'

export default getRequestConfig(async ({ locale: override }) => {
    const locale = override ?? (await rootParams.locale())
    if (!isLocale(locale)) notFound()
    return { locale, messages: (await import(`./${locale}.json`)).default }
})
