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
            <div className="w-full flex gap-2">
                <div className="flex items-center h-full w-fit">
                    <SidebarTrigger className="hover:bg-red-100 hover:text-blue-300" />
                </div>
                {children}
            </div>
        </SidebarProvider>
    )
}
