import { expect, type Page } from '@playwright/test'

declare global {
    interface Window {
        readonly __offlineListenerState?: { active: number; removals: number }
    }
}

// Observe real add/remove calls in this test's document, without app test hooks.
export async function observeOfflineListeners(page: Page) {
    await page.addInitScript(() => {
        const container = navigator.serviceWorker
        const add = container.addEventListener.bind(container)
        const remove = container.removeEventListener.bind(container)
        const listeners = new Set<EventListenerOrEventListenerObject>()
        let removals = 0
        Object.defineProperty(window, '__offlineListenerState', {
            get: () => ({ active: listeners.size, removals }),
        })
        Object.defineProperty(container, 'addEventListener', {
            value: (
                type: string,
                listener: EventListenerOrEventListenerObject,
                options?: boolean | AddEventListenerOptions
            ) => {
                if (type === 'message') listeners.add(listener)
                add(type, listener, options)
            },
        })
        Object.defineProperty(container, 'removeEventListener', {
            value: (
                type: string,
                listener: EventListenerOrEventListenerObject,
                options?: boolean | EventListenerOptions
            ) => {
                if (type === 'message' && listeners.delete(listener)) removals++
                remove(type, listener, options)
            },
        })
    })
}

export async function waitForOfflineListenerCleanup(page: Page) {
    await expect
        .poll(() => page.evaluate(() => window.__offlineListenerState))
        .toMatchObject({ active: 0, removals: expect.any(Number) })
    expect(
        await page.evaluate(() => window.__offlineListenerState?.removals)
    ).toBeGreaterThan(0)
}
