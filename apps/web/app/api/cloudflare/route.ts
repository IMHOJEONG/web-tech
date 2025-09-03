// app/api/cloudflare/zones/route.ts (Next.js 13+ App Router 기준)

import Cloudflare from "cloudflare";

const client = new Cloudflare({ apiToken: process.env.CLOUDFLARE_API_TOKEN! });

export async function GET() {
  try {
    const zones: any[] = [];
    for await (const zone of client.zones.list()) {
      zones.push(zone);
    }
    return new Response(JSON.stringify(zones), {
      headers: {
        "Content-Type": "application/json",
        // 필요하다면 CORS 헤더도 추가
        // "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
