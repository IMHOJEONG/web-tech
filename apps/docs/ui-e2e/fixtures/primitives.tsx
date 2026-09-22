import { StrictMode, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Badge } from '@web-tech/ui/components/badge'
import { Button } from '@web-tech/ui/components/button'
import { buttonVariants } from '@web-tech/ui/lib/button-variants'
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
    const [parentClicks, setParentClicks] = useState(0)
    const [childClicks, setChildClicks] = useState(0)
    const [submits, setSubmits] = useState(0)
    const [refsMatch, setRefsMatch] = useState(false)
    const outerRef = useRef<HTMLButtonElement>(null)
    const innerRef = useRef<HTMLButtonElement>(null)
    const [controlledTooltip, setControlledTooltip] = useState(false)
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
                <a
                    id="link-button"
                    href="#destination"
                    className={buttonVariants({ size: 'xs' })}
                >
                    Link button
                </a>
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
                <Badge
                    id="badge-link"
                    variant="link"
                    render={<a href="#destination" />}
                >
                    Linked badge
                </Badge>
            </section>
            <Input
                id="input"
                aria-label="Example input"
                placeholder="Example"
            />
            <TooltipProvider delay={1000} timeout={0}>
                <Tooltip>
                    <TooltipTrigger render={<Button id="delayed" />}>
                        Delayed tooltip
                    </TooltipTrigger>
                    <TooltipContent>Provider delay is respected</TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger render={<Button id="instant" />}>
                        Instant tooltip
                    </TooltipTrigger>
                    <TooltipContent>Default delay is zero</TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <Collapsible>
                <CollapsibleTrigger render={<Button id="collapse" />}>
                    Toggle content
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
                                    render={<a href="#destination" />}
                                    aria-label="Sidebar link"
                                >
                                    <Icon />
                                </SidebarMenuButton>
                            </SidebarMenuItem>
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
            <form
                onSubmit={(event) => {
                    event.preventDefault()
                    setSubmits(submits + 1)
                }}
            >
                <Button
                    id="composed"
                    ref={outerRef}
                    render={
                        <button
                            ref={innerRef}
                            onClick={() => setChildClicks((value) => value + 1)}
                        />
                    }
                    onClick={() => setParentClicks((value) => value + 1)}
                    className={() => 'h-11'}
                >
                    Composed action
                </Button>
                <Button
                    id="focus-composed"
                    onClick={() => {
                        setRefsMatch(
                            outerRef.current === innerRef.current &&
                                outerRef.current !== null
                        )
                        outerRef.current?.focus()
                    }}
                >
                    Focus composed
                </Button>
                <output id="composition-results">
                    {parentClicks}/{childClicks}/{submits}/{String(refsMatch)}
                </output>
            </form>
            <p id="extra-description">Existing explanation.</p>
            <TooltipProvider>
                <Tooltip
                    open={controlledTooltip}
                    onOpenChange={setControlledTooltip}
                >
                    <TooltipTrigger
                        aria-describedby="extra-description"
                        render={<Button id="controlled-tooltip" />}
                    >
                        Controlled tooltip
                    </TooltipTrigger>
                    <TooltipContent>Additional explanation.</TooltipContent>
                </Tooltip>
                <Tooltip onOpenChange={(_, details) => details.cancel()}>
                    <TooltipTrigger render={<Button id="cancelled-tooltip" />}>
                        Cancelled tooltip
                    </TooltipTrigger>
                    <TooltipContent>Should not open.</TooltipContent>
                </Tooltip>
                <Tooltip disabled>
                    <TooltipTrigger render={<Button id="disabled-tooltip" />}>
                        Disabled tooltip
                    </TooltipTrigger>
                    <TooltipContent>Disabled explanation.</TooltipContent>
                </Tooltip>
            </TooltipProvider>
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
