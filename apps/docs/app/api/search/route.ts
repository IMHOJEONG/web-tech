// app/api/search/route.ts
import { NextResponse } from 'next/server'
import { getSearchData } from '~/lib/get-search-data'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') ?? undefined

    const data = await getSearchData(q)

    return NextResponse.json(data)
}
