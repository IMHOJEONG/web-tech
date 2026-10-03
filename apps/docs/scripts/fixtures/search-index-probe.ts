import { connection } from 'next/server'
import { getSearchData } from '~/lib/get-search-data'

// Copied into the isolated test app only; never a production route.
export async function GET(request: Request) {
    await connection()
    const params = new URL(request.url).searchParams
    const docs = await getSearchData(params.get('q') ?? undefined, {
        includeRemote: params.get('remote') !== 'false',
    })
    return Response.json(
        docs.map(({ title, summary, contentSource }) => ({
            title,
            summary,
            contentSource,
        })),
        { headers: { 'Cache-Control': 'no-store' } }
    )
}
