import { randomUUID } from 'node:crypto'
import { cacheLife, cacheTag, revalidateTag } from 'next/cache'
import { getLocale } from 'next-intl/server'
import { connection } from 'next/server'
import { isValidContentRevalidationToken } from '~/lib/content-cache'
import ko from '~/shared/message/ko.json'
import en from '~/shared/message/en.json'

type Locale = 'ko' | 'en'
const tag = (locale: Locale) => `test:locale-copy:${locale}`

async function readCopy(locale: Locale) {
    'use cache'
    cacheLife({ stale: 0, revalidate: 3600, expire: 7200 })
    cacheTag(tag(locale))
    const messages = locale === 'ko' ? ko : en
    // A new ID means the function body executed, not merely a new HTTP request.
    return {
        locale,
        executionId: randomUUID(),
        description: messages.metadata.site.description,
    }
}

// Temporary app only. Request state is resolved before entering the cache.
export async function GET() {
    await connection()
    const locale = await getLocale()
    if (locale !== 'ko' && locale !== 'en')
        throw new Error('Unsupported fixture locale')
    return Response.json(await readCopy(locale), {
        headers: { 'Cache-Control': 'no-store' },
    })
}

export async function POST(request: Request) {
    if (
        !isValidContentRevalidationToken(
            request.headers.get('authorization'),
            process.env.BLOG_CONTENT_REVALIDATE_TOKEN
        )
    ) {
        return Response.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json().catch(() => null)
    if (body?.locale !== 'ko' && body?.locale !== 'en') {
        return Response.json({ message: 'Invalid locale' }, { status: 400 })
    }
    revalidateTag(tag(body.locale), { expire: 0 })
    return Response.json(
        { revalidated: true },
        { headers: { 'Cache-Control': 'no-store' } }
    )
}
