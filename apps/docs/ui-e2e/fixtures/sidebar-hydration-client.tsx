import { hydrateRoot } from 'react-dom/client'
import { SidebarHydration } from './sidebar-hydration'

hydrateRoot(document.getElementById('root')!, <SidebarHydration />, {
    onRecoverableError(error) {
        throw error
    },
})
