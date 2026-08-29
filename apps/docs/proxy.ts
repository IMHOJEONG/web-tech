import { NextResponse, type NextRequest } from 'next/server'
import { getRequestBlockReason } from './lib/request-blocklist'

export function proxy(request: NextRequest) {
    const blockReason = getRequestBlockReason(
        request.nextUrl.pathname,
        request.method
    )

    if (!blockReason) {
        return NextResponse.next()
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
