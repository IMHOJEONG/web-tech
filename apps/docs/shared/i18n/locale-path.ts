export const locales = ['ko', 'en'] as const
export type AppLocale = (typeof locales)[number]
export const defaultLocale: AppLocale = 'en'

export function isLocale(value: unknown): value is AppLocale {
    return value === 'ko' || value === 'en'
}

export function stripLocale(pathname: string) {
    return pathname.replace(/^\/(ko|en)(?=\/|$)/, '') || '/'
}

export function localizePath(pathname: string, locale: AppLocale) {
    if (!pathname.startsWith('/') || pathname.startsWith('//')) return pathname
    const path = stripLocale(pathname)
    return `/${locale}${path === '/' ? '' : path}`
}
