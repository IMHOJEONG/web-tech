import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'

type AppLocale = 'en' | 'ko'

function normalizeLocale(value?: string | null): AppLocale | null {
    if (!value) {
        return null
    }

    const lowered = value.toLowerCase()

    if (lowered.startsWith('ko')) {
        return 'ko'
    }

    if (lowered.startsWith('en')) {
        return 'en'
    }

    return null
}

export default getRequestConfig(async () => {
    const cookieStore = await cookies()
    const headerStore = await headers()

    const cookieLocale = normalizeLocale(cookieStore.get('NEXT_LOCALE')?.value)
    const acceptLanguage = headerStore.get('accept-language')
    const headerLocale = acceptLanguage
        ?.split(',')
        .map((part) => normalizeLocale(part.trim()))
        .find((locale): locale is AppLocale => locale !== null)

    const locale = cookieLocale ?? headerLocale ?? 'en'

    return {
        locale,
        messages: (await import(`./${locale}.json`)).default,
    }
})
