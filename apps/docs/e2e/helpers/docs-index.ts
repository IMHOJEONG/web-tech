import { expect, type Page } from '@playwright/test'

export function visibleDocsIndexFilters(page: Page) {
    // The fallback has identical controls but is replaced when the results arrive.
    return readyDocsIndex(page).getByTestId('docs-index-filters')
}

export function readyDocsIndex(page: Page) {
    return page.locator('main:visible').filter({
        has: page.getByTestId('docs-index-results'),
    })
}

export async function openDocsIndexFilters(page: Page) {
    const filters = visibleDocsIndexFilters(page)
    await expect(filters).toHaveCount(1)
    if (
        !(await filters.evaluate(
            (element) => (element as HTMLDetailsElement).open
        ))
    ) {
        await filters.locator('summary').click()
    }
    await expect(filters).toHaveAttribute('open')
}
