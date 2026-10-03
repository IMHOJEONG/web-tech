import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { normalizeOgText } from '~/lib/article-sharing'

export const runtime = 'nodejs'

// Read the traced runtime asset without fetching fonts or article data from NAS.
let font: Promise<Buffer> | undefined

export async function GET(request: Request) {
    const params = new URL(request.url).searchParams
    const title = normalizeOgText(params.get('title'), 90, 'HEAP-FORGE')
    const topic = normalizeOgText(params.get('topic'), 28, 'TECHNICAL NOTES')
    const author = normalizeOgText(params.get('author'), 32)
    font ??= readFile(
        join(process.cwd(), 'public/fonts/Pretendard-Bold.otf')
    ).catch((error: unknown) => {
        font = undefined
        throw error
    })
    const fontData = await font

    return new ImageResponse(
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                padding: 56,
                background: '#faf9f6',
                color: '#191919',
                fontFamily: 'Pretendard',
                borderTop: '12px solid #ff7014',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 28,
                }}
            >
                <span style={{ color: '#e85d04', letterSpacing: 2 }}>
                    HEAP-FORGE
                </span>
                <span style={{ fontSize: 22, color: '#62625c' }}>{topic}</span>
            </div>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    flex: 1,
                    fontSize: Array.from(title).length > 45 ? 48 : 64,
                    lineHeight: 1.2,
                    letterSpacing: -1.5,
                    overflow: 'hidden',
                    wordBreak: 'break-word',
                }}
            >
                {title}
            </div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px solid #d8d6cf',
                    paddingTop: 24,
                    color: '#62625c',
                    fontSize: 22,
                }}
            >
                <span>{author || 'HEAP-FORGE'}</span>
                <span>heap-forge.app</span>
            </div>
        </div>,
        {
            width: 1200,
            height: 630,
            fonts: [
                {
                    name: 'Pretendard',
                    data: fontData,
                    weight: 700,
                    style: 'normal',
                },
            ],
            headers: {
                'Cache-Control': 'public, max-age=3600, s-maxage=86400',
                'X-Content-Type-Options': 'nosniff',
            },
        }
    )
}
