import type { SearchData } from '~/lib/get-search-data'
import { UIUX_HUB_EDITORIAL_ASSETS } from '~/shared/assets/editorial'

export type UiUxDoc = SearchData & {
    title: string
    href: string
    summary: string
}

export const UIUX_FALLBACK_IMAGES = UIUX_HUB_EDITORIAL_ASSETS
