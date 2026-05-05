import { SidebarProvider } from '@web-tech/ui/components/sidebar'
import { CategorySidebar } from '~/widgets/category-sidebar/ui/category-sidebar'

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <CategorySidebar
                variant="inset"
                className="top-[4.0625rem] h-[calc(100svh-4.0625rem)]"
            />
            <div className="flex w-full min-w-0">
                <div className="min-w-0 flex-1">{children}</div>
            </div>
        </SidebarProvider>
    )
}
