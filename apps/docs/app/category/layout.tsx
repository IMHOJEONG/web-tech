import { SidebarProvider } from '@web-tech/ui/components/sidebar'
import { AppSidebar } from '~/components/app-sidebar/app-sidebar'

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar
                variant="inset"
                className="top-[4.0625rem] h-[calc(100svh-4.0625rem)]"
            />
            <div className="w-full flex gap-2">
                {/* <div className="flex h-full w-fit">
                    <SidebarTrigger className="hover:bg-red-100 hover:text-blue-300" />
                </div> */}
                {children}
            </div>
        </SidebarProvider>
    )
}
