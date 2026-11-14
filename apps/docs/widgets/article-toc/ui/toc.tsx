'use client'

import { type MouseEvent, useState } from 'react'
import type { TocItem } from 'remark-flexible-toc'

import { filterTocItems, type TocFilters } from '../model/toc-items'
import { getHeadingId } from '../model/active-heading'
import { useActiveHeading } from '../model/use-active-heading'
import { TocSummary } from './toc-summary'
import { TocLinks } from './toc-links'

type Props = TocFilters & {
    toc?: TocItem[]
    title?: string
    indented?: boolean
    ordered?: boolean
    tight?: boolean
    defaultOpen?: boolean
    closeOnNavigate?: boolean
}

const Toc = ({
    toc,
    title = 'On this page',
    maxDepth = 6,
    ordered = false,
    indented = true,
    tight = false,
    exclude,
    skipLevels = [1],
    skipParents = [],
    defaultOpen = true,
    closeOnNavigate = false,
}: Props) => {
    const [isOpen, setIsOpen] = useState(defaultOpen)
    const filteredToc = filterTocItems(toc, {
        maxDepth,
        exclude,
        skipLevels,
        skipParents,
    })
    const activeHref = useActiveHeading(
        JSON.stringify(filteredToc.map((heading) => heading.href))
    )
    const handleAnchorClick = (
        event: MouseEvent<HTMLAnchorElement>,
        href: string
    ) => {
        if (
            !href.startsWith('#') ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey ||
            event.button !== 0
        ) {
            return
        }

        const id = getHeadingId(href)
        const target = id ? document.getElementById(id) : null

        if (!target) {
            return
        }

        event.preventDefault()

        window.history.replaceState(window.history.state, '', href)

        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches

        const scrollToHeading = () => {
            target.scrollIntoView({
                behavior: prefersReducedMotion ? 'auto' : 'smooth',
                block: 'start',
            })
            if (closeOnNavigate) {
                const addedTabIndex = !target.hasAttribute('tabindex')
                if (addedTabIndex) target.tabIndex = -1
                target.classList.add('toc-focus-target')
                target.addEventListener(
                    'blur',
                    () => {
                        if (addedTabIndex) target.removeAttribute('tabindex')
                        target.classList.remove('toc-focus-target')
                    },
                    { once: true }
                )
                target.focus({ preventScroll: true })
            }
        }

        if (closeOnNavigate) {
            setIsOpen(false)
            requestAnimationFrame(scrollToHeading)
        } else {
            scrollToHeading()
        }
    }
    if (filteredToc.length === 0) return null
    return (
        <details
            className="group min-w-0"
            open={isOpen}
            onKeyDown={(event) => {
                if (event.key === 'Escape' && isOpen && closeOnNavigate) {
                    event.preventDefault()
                    setIsOpen(false)
                    event.currentTarget.querySelector('summary')?.focus()
                }
            }}
        >
            <TocSummary
                title={title}
                count={filteredToc.length}
                currentTitle={
                    filteredToc.find((item) => item.href === activeHref)?.value
                }
                onToggle={() => setIsOpen((current) => !current)}
            />
            <nav aria-label={title} className="min-w-0 pb-2 pt-2">
                <TocLinks
                    items={filteredToc}
                    activeHref={activeHref}
                    indented={indented}
                    ordered={ordered}
                    tight={tight}
                    onNavigate={handleAnchorClick}
                />
            </nav>
        </details>
    )
}

export default Toc
