'use client'

import { useEffect } from 'react'

// A streamed body can arrive after the browser's initial fragment scroll.
export function ArticleFragmentRestore() {
    useEffect(() => {
        const hash = window.location.hash
        if (!hash) return
        let id: string
        try {
            id = decodeURIComponent(hash.slice(1))
        } catch {
            return
        }
        let cancelled = false
        let frame = 0
        const cancel = () => {
            cancelled = true
        }
        const events = [
            'wheel',
            'touchstart',
            'pointerdown',
            'keydown',
            'hashchange',
        ] as const
        for (const event of events)
            window.addEventListener(event, cancel, { passive: true })

        void document.fonts.ready.then(() => {
            if (cancelled) return
            frame = requestAnimationFrame(() => {
                const target = document.getElementById(id)
                if (
                    cancelled ||
                    window.location.hash !== hash ||
                    window.scrollY !== 0 ||
                    !target?.closest('[data-offline-content]') ||
                    target.getBoundingClientRect().top < window.innerHeight
                )
                    return
                target.scrollIntoView({ block: 'start', behavior: 'instant' })
            })
        })
        return () => {
            cancelled = true
            cancelAnimationFrame(frame)
            for (const event of events)
                window.removeEventListener(event, cancel)
        }
    }, [])
    return null
}
