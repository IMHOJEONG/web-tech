import { test } from '@playwright/test'
import { expectPrefetchNavigation } from './prefetch-navigation-scenario.ts'

for (const locale of ['ko', 'en']) {
    test(`prefetch direct URL control: ${locale} document replacement interrupts a pending response`, async ({
        page,
        request,
    }, testInfo) => {
        await expectPrefetchNavigation(
            {
                page,
                request,
                locale,
                method: 'document-replacement',
                navigate: async (destination) => {
                    await page.goto(destination)
                },
            },
            testInfo
        )
    })
}
