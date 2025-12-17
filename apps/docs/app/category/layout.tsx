import {
    SidebarProvider,
    SidebarTrigger,
} from '@web-tech/ui/components/sidebar'
import { AppSidebar } from '~/components/app-sidebar/app-sidebar'

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarTrigger />
            {/* {children} */}
        </SidebarProvider>
    )
}
