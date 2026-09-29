import { stripLocale } from '../../../shared/i18n/locale-path.ts'

export const APP_NAVIGATION = [
    { href: '/feed', key: 'feed' },
    { href: '/web', key: 'web' },
    { href: '/mobile', key: 'mobile' },
    { href: '/ui-ux', key: 'uiux' },
    { href: '/about', key: 'about' },
] as const

export type AppNavigationKey = (typeof APP_NAVIGATION)[number]['key']

const SECTION_ROUTES: Record<AppNavigationKey, readonly string[]> = {
    feed: ['/feed', '/docs/feed'],
    web: ['/web', '/category/fe', '/docs/web', '/docs/category/fe'],
    mobile: ['/mobile', '/docs/mobile'],
    uiux: ['/ui-ux', '/docs/ui-ux'],
    about: ['/about'],
}

function matchesRoute(path: string, prefix: string) {
    return path === prefix || path.startsWith(`${prefix}/`)
}

export function getActiveNavigationKey(
    pathname: string | null | undefined
): AppNavigationKey | null {
    if (!pathname?.startsWith('/') || pathname.startsWith('//')) return null
    const path =
        stripLocale(pathname.split(/[?#]/, 1)[0]!).replace(/\/+$/, '') || '/'

    for (const { key } of APP_NAVIGATION) {
        if (SECTION_ROUTES[key].some((prefix) => matchesRoute(path, prefix))) {
            return key
        }
    }

    // Keep the docs index fallback, but only after matching a specific section.
    if (path === '/' || matchesRoute(path, '/docs')) return 'feed'
    return null
}
