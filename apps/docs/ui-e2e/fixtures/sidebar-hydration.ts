import { createElement as h, Fragment, StrictMode } from 'react'
import {
    Sidebar,
    SidebarContent,
    SidebarProvider,
    useSidebar,
} from '@web-tech/ui/components/sidebar'

function ViewportState() {
    const { isMobile, openMobile, toggleSidebar } = useSidebar()
    return h(
        Fragment,
        null,
        h(
            'output',
            { 'data-testid': 'viewport' },
            isMobile ? 'mobile' : 'desktop'
        ),
        h('output', { 'data-testid': 'mobile-open' }, String(openMobile)),
        h('button', { onClick: toggleSidebar }, 'Toggle sidebar')
    )
}

export function SidebarHydration() {
    // Avoid Playwright's JSX transform so the same fixture can render on the server.
    return h(
        StrictMode,
        null,
        h(
            SidebarProvider,
            null,
            h(ViewportState),
            h(Sidebar, null, h(SidebarContent, null, 'Sidebar content'))
        )
    )
}
