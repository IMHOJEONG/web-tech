import { NextResponse, type NextRequest } from 'next/server'
import { getRequestBlockReason } from './lib/request-blocklist'
import createMiddleware from 'next-intl/middleware'
import { routing } from './shared/i18n/routing'
import { stripLocale } from './shared/i18n/locale-path'

const handleLocale = createMiddleware(routing)

export function proxy(request: NextRequest) {
    const blockReason = getRequestBlockReason(
        stripLocale(request.nextUrl.pathname),
        request.method
    )

    if (!blockReason) {
        const pathname = request.nextUrl.pathname
        if (
            /^\/(api|_next|_vercel)(\/|$)/.test(pathname) ||
            /\.[^/]+$/.test(pathname)
        ) {
            return NextResponse.next()
        }
        return handleLocale(request)
    }

    console.warn('[docs] Blocked suspicious request.', {
        method: request.method,
        pathname: request.nextUrl.pathname,
        reason: blockReason,
    })

    return new NextResponse(null, {
        status: 404,
        headers: {
            'cache-control': 'no-store',
        },
    })
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|webp|gif|svg|ico|css|js|txt|xml|woff2?)$).*)',
    ],
}
