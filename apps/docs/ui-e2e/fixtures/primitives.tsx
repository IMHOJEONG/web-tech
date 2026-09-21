import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Badge } from '@web-tech/ui/components/badge'
import { Button } from '@web-tech/ui/components/button'
import { Input } from '@web-tech/ui/components/input'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@web-tech/ui/components/collapsible'
import { Separator } from '@web-tech/ui/components/separator'
import {
    Sidebar,
    SidebarContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
} from '@web-tech/ui/components/sidebar'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@web-tech/ui/components/tooltip'

function Icon({ className }: { className?: string }) {
    return (
        <svg className={className} aria-hidden="true" viewBox="0 0 24 24">
            <path d="M4 12h16" />
        </svg>
    )
}

function Primitives() {
    const [clicks, setClicks] = useState(0)
    return (
        <main className="space-y-6 p-8">
            <section className="flex flex-wrap items-center gap-4">
                <Button id="default">Default</Button>
                <Button id="xs" size="xs" onClick={() => setClicks(clicks + 1)}>
                    <Icon />
                    Small
                </Button>
                <Button id="icon-xs" size="icon-xs" aria-label="Small action">
                    <Icon />
                </Button>
                <Button
                    id="override"
                    size="icon-xs"
                    className="size-11"
                    aria-label="Touch action"
                >
                    <Icon className="size-5" />
                </Button>
                <Button
                    id="disabled"
                    size="xs"
                    disabled
                    onClick={() => setClicks(clicks + 1)}
                >
                    Disabled
                </Button>
                <Button id="link-button" asChild size="xs">
                    <a href="#destination">Link button</a>
                </Button>
                <output id="clicks">{clicks}</output>
            </section>
            <section className="flex flex-wrap gap-4">
                <Badge id="badge-default">Default</Badge>
                <Badge id="badge-outline" variant="outline">
                    Outline
                </Badge>
                <Badge id="badge-ghost" variant="ghost">
                    Ghost
                </Badge>
                <Badge id="badge-link" variant="link" asChild>
                    <a href="#destination">Linked badge</a>
                </Badge>
            </section>
            <Input
                id="input"
                aria-label="Example input"
                placeholder="Example"
            />
            <TooltipProvider delayDuration={1000} skipDelayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button id="delayed">Delayed tooltip</Button>
                    </TooltipTrigger>
                    <TooltipContent>Provider delay is respected</TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button id="instant">Instant tooltip</Button>
                    </TooltipTrigger>
                    <TooltipContent>Default delay is zero</TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <Collapsible>
                <CollapsibleTrigger asChild>
                    <Button id="collapse">Toggle content</Button>
                </CollapsibleTrigger>
                <CollapsibleContent>Expanded content</CollapsibleContent>
            </Collapsible>
            <Separator decorative={false} />
            <SidebarProvider defaultOpen={false} className="min-h-0">
                <Sidebar collapsible="icon">
                    <SidebarContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    tooltip="Sidebar destination"
                                    aria-label="Sidebar destination"
                                >
                                    <Icon />
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarContent>
                </Sidebar>
            </SidebarProvider>
            <div id="destination">Destination</div>
        </main>
    )
}

document.documentElement.classList.toggle(
    'dark',
    matchMedia('(prefers-color-scheme: dark)').matches
)
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Primitives />
    </StrictMode>
)
