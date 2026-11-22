'use client'

import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from '@web-tech/ui/components/sheet'
import { Search as SearchIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef, useState, useSyncExternalStore } from 'react'
import { useSearchKeyword } from '../model/use-search-keyword'
import { SearchDrawerContent } from './search-drawer-content'

const subscribeToHydration = () => () => {}

export function SearchDrawer({ initialKeyword }: { initialKeyword: string }) {
    const t = useTranslations('search')
    const [open, setOpen] = useState(false)
    const input = useSearchKeyword(initialKeyword)
    const inputRef = useRef<HTMLInputElement>(null)
    const hydrated = useSyncExternalStore(
        subscribeToHydration,
        () => true,
        () => false
    )
    const changeOpen = (nextOpen: boolean) => {
        if (!nextOpen && input.composing.current) input.finishComposition()
        setOpen(nextOpen)
    }
    return (
        <Sheet
            open={open}
            onOpenChange={(nextOpen, details) => {
                if (
                    details.reason === 'escape-key' &&
                    input.composing.current
                ) {
                    details.cancel()
                    return
                }
                changeOpen(nextOpen)
            }}
        >
            <SheetTrigger
                data-testid="search-drawer-trigger"
                disabled={!hydrated}
                aria-label={t('input.triggerLabel')}
                className="ds-focus-ring inline-flex size-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface-variant transition-colors hover:border-primary/40 hover:text-on-surface lg:w-auto lg:px-3"
            >
                <SearchIcon aria-hidden="true" className="size-4 shrink-0" />
                <span className="hidden text-sm font-medium lg:inline">
                    {t('input.triggerLabel')}
                </span>
            </SheetTrigger>
            <SheetContent
                side="right"
                showCloseButton={false}
                initialFocus={inputRef}
                className="flex h-dvh w-full max-w-full flex-col gap-0 border-l border-outline-variant bg-background text-on-surface sm:max-w-[36rem]"
                onKeyDown={(event) => {
                    if (event.key === 'Escape' && input.composing.current)
                        event.preventDefault()
                }}
            >
                <SearchDrawerContent
                    open={open}
                    input={input}
                    inputRef={inputRef}
                    onNavigate={() => changeOpen(false)}
                />
            </SheetContent>
        </Sheet>
    )
}
