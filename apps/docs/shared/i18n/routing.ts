import { defineRouting } from 'next-intl/routing'
import { locales, defaultLocale } from './locale-path'

export const routing = defineRouting({
    locales,
    defaultLocale,
    localePrefix: 'always',
})
