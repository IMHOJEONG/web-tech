'use client'

import { useEffect, useRef, type ReactNode } from 'react'

export function HeaderFrame({ children }: { children: ReactNode }) {
    const ref = useRef<HTMLElement>(null)

    useEffect(() => {
        const header = ref.current
        if (!header) return

        const root = document.documentElement
        const updateHeight = () => {
            root.style.setProperty(
                '--docs-header-height',
                `${header.getBoundingClientRect().height}px`
            )
        }
        updateHeight()
        // Font preferences can change height without a viewport resize.
        const observer = new ResizeObserver(updateHeight)
        observer.observe(header)
        return () => {
            observer.disconnect()
            root.style.removeProperty('--docs-header-height')
        }
    }, [])

    return (
        <header
            ref={ref}
            className="@container/shell sticky top-0 z-50 min-h-16.25 shrink-0 w-full border-b border-header-border bg-background text-on-surface shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
        >
            {children}
        </header>
    )
}
