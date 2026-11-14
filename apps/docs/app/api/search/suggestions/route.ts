import { NextResponse } from 'next/server'
import { getSearchData } from '~/lib/get-search-data'
import { buildSearchSuggestions } from '~/lib/search-suggestions'
import { normalizeSearchQuery } from '~/shared/lib/search-query'

export async function GET(request: Request) {
    const query = normalizeSearchQuery(
        new URL(request.url).searchParams.getAll('q')
    )
    const docs = await getSearchData(query, { observeRequest: true })
    return NextResponse.json(buildSearchSuggestions(docs, query), {
        headers: { 'Cache-Control': 'no-store' },
    })
}
