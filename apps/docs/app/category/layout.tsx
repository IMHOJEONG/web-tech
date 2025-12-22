import {
    SidebarProvider,
    SidebarTrigger,
} from '@web-tech/ui/components/sidebar'
import { AppSidebar } from '~/components/app-sidebar/app-sidebar'
import { HEADER_HEIGHT_TOP } from '~/shared/constants'

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar
                variant="inset"
                className={`h-full ${HEADER_HEIGHT_TOP}`}
            />
            <SidebarTrigger />
            {children}
        </SidebarProvider>
    )
}
