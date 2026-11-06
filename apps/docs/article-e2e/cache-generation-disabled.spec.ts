import { expect, test } from '@playwright/test'
import { articleFixtureAuthorization } from './fixture-credentials.ts'

test('normal server does not expose the generation experiment control plane', async ({
    request,
}) => {
    const result = await request.get('/__test/cache-generation/state', {
        headers: {
            Authorization: articleFixtureAuthorization('control'),
            'x-article-generation-probe': '1',
        },
    })
    expect(result.status()).toBe(404)
    expect(result.headers()['content-type']).not.toContain('application/json')
})
