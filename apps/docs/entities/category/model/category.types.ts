import type { LucideIcon } from 'lucide-react'
import type { IconType } from 'react-icons'

export interface CategoryItemConfig {
    title: string
    url: string
    icon: LucideIcon | IconType
    summaryKey: string
}

export interface CategoryGroupConfig extends CategoryItemConfig {
    sub: readonly CategoryItemConfig[]
}
