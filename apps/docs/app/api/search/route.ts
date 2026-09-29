// app/api/search/route.ts
import { NextResponse } from 'next/server'
import { getSearchData } from '~/lib/get-search-data'
import { buildSearchApiResponse } from '~/lib/search-api-response'
import { normalizeSearchQuery } from '~/shared/lib/search-query'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const q = normalizeSearchQuery(searchParams.getAll('q'))
    const data = await getSearchData(q)

    return NextResponse.json(buildSearchApiResponse(data, q))
}
