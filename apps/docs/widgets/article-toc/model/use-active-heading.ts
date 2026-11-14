'use client'

import { useEffect, useState } from 'react'
import {
    findActiveHeading,
    getHeadingId,
    type HeadingPosition,
} from './active-heading'

export function useActiveHeading(headingKey: string) {
    const [activeHref, setActiveHref] = useState<string | null>(null)

    useEffect(() => {
        const hrefs: string[] = JSON.parse(headingKey)
        const targets = hrefs.flatMap((href) => {
            const id = getHeadingId(href)
            const element = id ? document.getElementById(id) : null
            return element ? [{ href, element }] : []
        })
        if (!targets.length) return

        const header = document.querySelector('header')
        let positions: HeadingPosition[] = []
        let headerHeight = 0
        let frame = 0
        let disposed = false
        let current: string | null = null

        const update = () => {
            frame = 0
            const atBottom =
                window.scrollY > 0 &&
                window.scrollY + window.innerHeight >=
                    document.documentElement.scrollHeight - 4
            const next = findActiveHeading(
                positions,
                window.scrollY + headerHeight + 32,
                atBottom
            )
            if (next !== current) {
                current = next
                setActiveHref(next)
            }
        }
        const scheduleUpdate = () => {
            if (!frame) frame = requestAnimationFrame(update)
        }
        const measure = () => {
            if (disposed) return
            headerHeight = header?.getBoundingClientRect().height ?? 0
            // Layout reads happen on resize, not on every scroll event.
            positions = targets
                .map(({ href, element }) => ({
                    href,
                    top: element.getBoundingClientRect().top + window.scrollY,
                }))
                .sort((a, b) => a.top - b.top)
            scheduleUpdate()
        }

        const observer = new ResizeObserver(measure)
        const article = document.getElementById('main-content')
        if (article) observer.observe(article)
        if (header) observer.observe(header)
        window.addEventListener('scroll', scheduleUpdate, { passive: true })
        window.addEventListener('resize', measure)
        document.fonts.ready.then(measure)
        measure()

        return () => {
            disposed = true
            cancelAnimationFrame(frame)
            observer.disconnect()
            window.removeEventListener('scroll', scheduleUpdate)
            window.removeEventListener('resize', measure)
        }
    }, [headingKey])

    return activeHref
}
