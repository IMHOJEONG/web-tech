'use client'

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
} from '@web-tech/ui/components/sidebar'

import { cn } from '@web-tech/ui/lib/utils'
import { usePathname } from 'next/navigation'
import {
    categoryTree,
    makeCategoryUrl,
} from '~/entities/category/model/category'

export function CategorySidebar({
    ...props
}: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()?.replace(/\/$/, '')

    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Category</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {categoryTree.map((item) => (
                                <SidebarMenuItem
                                    className="flex flex-col gap-1"
                                    key={item.title}
                                >
                                    <SidebarMenuButton asChild>
                                        <a
                                            href={makeCategoryUrl([item.url])}
                                            className={cn(
                                                'hover:bg-slate-300 hover:text-black hover:opacity-90',
                                                'dark:hover:bg-gray-100',
                                                {
                                                    'bg-blue-100 dark:bg-gray-400':
                                                        pathname ===
                                                        makeCategoryUrl([
                                                            item.url,
                                                        ]),
                                                }
                                            )}
                                        >
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>

                                    <div className="flex flex-col gap-3">
                                        {item.sub?.map((subItem) => {
                                            return (
                                                <SidebarMenuSub
                                                    key={subItem.title}
                                                >
                                                    <SidebarMenuSubItem>
                                                        <a
                                                            href={makeCategoryUrl(
                                                                [
                                                                    item.url,
                                                                    subItem.url,
                                                                ]
                                                            )}
                                                            className={cn(
                                                                'flex items-center gap-2 p-2 transition-all duration-300 ease-out',
                                                                'hover:bg-slate-300 hover:text-black hover:opacity-90',
                                                                'dark:hover:bg-gray-100',
                                                                {
                                                                    'bg-blue-100 dark:bg-gray-400':
                                                                        pathname ===
                                                                        makeCategoryUrl(
                                                                            [
                                                                                item.url,
                                                                                subItem.url,
                                                                            ]
                                                                        ),
                                                                }
                                                            )}
                                                        >
                                                            <subItem.icon />
                                                            <span>
                                                                {subItem.title}
                                                            </span>
                                                        </a>
                                                    </SidebarMenuSubItem>
                                                </SidebarMenuSub>
                                            )
                                        })}
                                    </div>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
