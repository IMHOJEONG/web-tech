import type { LucideIcon } from 'lucide-react'
import type messages from '~/shared/message/ko.json'

export interface DrawerLinkConfig {
    href: `/${string}`
    key: keyof typeof messages.navigation
    icon: LucideIcon
    activePrefixes: readonly `/${string}`[]
}
