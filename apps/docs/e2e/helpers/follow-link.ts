import type { Locator, Page } from '@playwright/test'

export async function followLink(page: Page, link: Locator, pathname: string) {
    const destination = new URL(pathname, page.url()).href
    // Navigation has its own deadline; the 5s UI assertion budget is not a route budget.
    await Promise.all([
        page.waitForURL(destination, { waitUntil: 'commit' }),
        link.click(),
    ])
}
