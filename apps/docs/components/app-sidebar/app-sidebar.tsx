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
} from '@/components/ui/sidebar'

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import { items, makeUrl } from '~/feature/category/category-item'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()?.replace(/\/$/, '')

    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Category</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <Collapsible
                                    defaultOpen
                                    className="group/collapsible"
                                    key={item.title}
                                >
                                    <SidebarMenuItem className="flex flex-col gap-1">
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton asChild>
                                                <a
                                                    href={makeUrl([item.url])}
                                                    className={cn(
                                                        '',

                                                        {
                                                            'bg-blue-100 dark:bg-gray-400':
                                                                pathname ===
                                                                makeUrl([
                                                                    item.url,
                                                                ]),
                                                        }
                                                    )}
                                                >
                                                    <item.icon />
                                                    <span>{item.title}</span>
                                                </a>
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="flex flex-col gap-3">
                                            {item.sub?.map((subItem) => {
                                                return (
                                                    <SidebarMenuSub
                                                        key={subItem.title}
                                                    >
                                                        <SidebarMenuSubItem>
                                                            <a
                                                                href={makeUrl([
                                                                    item.url,
                                                                    subItem.url,
                                                                ])}
                                                                className={cn(
                                                                    'flex items-center gap-2',
                                                                    'p-2',
                                                                    'transition-all duration-300 ease-out',
                                                                    'hover:opacity-90',
                                                                    'dark:hover:bg-gray-100',
                                                                    'hover:bg-slate-300 hover:text-black',
                                                                    {
                                                                        'bg-blue-100 dark:bg-gray-400':
                                                                            pathname ===
                                                                            makeUrl(
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
                                                                    {
                                                                        subItem.title
                                                                    }
                                                                </span>
                                                            </a>
                                                        </SidebarMenuSubItem>
                                                    </SidebarMenuSub>
                                                )
                                            })}
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            {/* <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Application</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <a href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent> */}
        </Sidebar>
    )
}
