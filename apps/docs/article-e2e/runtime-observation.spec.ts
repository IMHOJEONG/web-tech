import { expect, test } from '@playwright/test'

test('dynamic docs and search replace external request IDs on every request', async ({
    request,
}) => {
    const spoof = 'cd6e9f64-1190-4e34-8f79-7e8185175327'
    const ids = new Set<string>()
    for (const path of [
        '/ko/docs?q=React',
        '/en/docs?q=React',
        '/api/search?q=React',
        '/ko/docs/missing-observation-document',
    ]) {
        const response = await request.get(path, {
            headers: { 'x-docs-request-id': spoof },
        })
        const id = response.headers()['x-docs-request-id']
        expect(id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        )
        expect(id).not.toBe(spoof)
        ids.add(id!)
        if (!path.includes('missing')) expect(response.ok()).toBe(true)
    }
    expect(ids.size).toBe(4)
})
