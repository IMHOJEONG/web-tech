import { expect, test } from '@playwright/test'
import { expectPrefetchNavigation } from './prefetch-navigation-scenario.ts'

for (const locale of ['ko', 'en']) {
    for (const method of ['menu-link', 'prefetched-link'] as const) {
        test(`prefetch Link navigation: ${locale} ${method}`, async ({
            page,
            request,
        }, testInfo) => {
            await expectPrefetchNavigation(
                {
                    page,
                    request,
                    locale,
                    method,
                    navigate: async (destination) => {
                        if (method === 'prefetched-link') {
                            await page
                                .getByRole('main')
                                .locator(`a[href="${destination}"]`)
                                .first()
                                .click()
                        } else if (testInfo.project.name === 'article-mobile') {
                            const trigger = page.getByTestId(
                                'mobile-nav-drawer-trigger'
                            )
                            await expect(trigger).toBeEnabled()
                            await trigger.click()
                            await page
                                .getByRole('dialog')
                                .locator(`a[href="${destination}"]`)
                                .click()
                        } else {
                            await page
                                .getByTestId('desktop-navigation')
                                .locator(`a[href="${destination}"]`)
                                .click()
                        }
                    },
                },
                testInfo
            )
        })
    }
}
