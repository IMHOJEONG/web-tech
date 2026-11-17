import type { Page, TestInfo } from '@playwright/test'
import {
    actualMainCount,
    articleMainAnnotation,
    observeArticleMainFailure,
} from '../../scripts/article-main-diagnostic.ts'

export function observeArticleMainAssertion(
    page: Page,
    testInfo: TestInfo,
    check: () => Promise<unknown>
) {
    return observeArticleMainFailure(
        check,
        async (error) => {
            const roleCount = await page.getByRole('main').count()
            const state = await page.evaluate(() => ({
                domCount: document.querySelectorAll('main').length,
                pendingCount: document.querySelectorAll(
                    '[data-page-pending="article"]'
                ).length,
                bodyCount: document.querySelectorAll('.mdx-wrapper').length,
                bodyVisible: [
                    ...document.querySelectorAll('.mdx-wrapper'),
                ].some((element) =>
                    element.checkVisibility({ visibilityProperty: true })
                ),
            }))
            return { actualCount: actualMainCount(error), roleCount, ...state }
        },
        (value) =>
            testInfo.annotations.push({
                type: articleMainAnnotation,
                description: JSON.stringify(value),
            })
    )
}
