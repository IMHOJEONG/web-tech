// app/api/cloudflare/zones/route.ts (Next.js 13+ App Router 기준)

import Cloudflare from "cloudflare";
import { NextRequest, NextResponse } from "next/server";

const client = new Cloudflare({ apiToken: process.env.CLOUDFLARE_API_TOKEN! });

export async function POST(request: NextRequest) {
  try {
    const { query, option } = await request.json();
    console.log(query, option);
    const response = await client.radar.netflows.timeseries(query, option);
    return NextResponse.json(response);
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
