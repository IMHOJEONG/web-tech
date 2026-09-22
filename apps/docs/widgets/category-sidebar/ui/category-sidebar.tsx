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
import { usePathname } from '~/shared/i18n/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { useLocale } from 'next-intl'
import {
    localizePath,
    isLocale,
    defaultLocale,
} from '~/shared/i18n/locale-path'
import {
    categoryTree,
    makeCategoryUrl,
} from '~/entities/category/model/category'

export function CategorySidebar({
    ...props
}: React.ComponentProps<typeof Sidebar>) {
    return (
        <Suspense fallback={<SidebarItems {...props} />}>
            <ActiveSidebar {...props} />
        </Suspense>
    )
}

function ActiveSidebar(props: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()?.replace(/\/$/, '')
    return <SidebarItems {...props} pathname={pathname} />
}

function SidebarItems({
    pathname = '',
    ...props
}: React.ComponentProps<typeof Sidebar> & { pathname?: string }) {
    const value = useLocale()
    const locale = isLocale(value) ? value : defaultLocale
    const categoryHref = (segments: string[]) =>
        localizePath(makeCategoryUrl(segments), locale)

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
                                    <SidebarMenuButton
                                        render={
                                            <Link
                                                href={categoryHref([item.url])}
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
                                            />
                                        }
                                    >
                                        <item.icon />
                                        <span>{item.title}</span>
                                    </SidebarMenuButton>

                                    <div className="flex flex-col gap-3">
                                        {item.sub?.map((subItem) => {
                                            return (
                                                <SidebarMenuSub
                                                    key={subItem.title}
                                                >
                                                    <SidebarMenuSubItem>
                                                        <Link
                                                            href={categoryHref([
                                                                item.url,
                                                                subItem.url,
                                                            ])}
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
                                                        </Link>
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
