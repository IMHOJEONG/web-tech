import { expect, type Page } from '@playwright/test'

export function visibleDocsIndexFilters(page: Page) {
    // Streaming can keep the next tree hidden while the current controls remain visible.
    return page.locator('[data-testid="docs-index-filters"]:visible')
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
}
