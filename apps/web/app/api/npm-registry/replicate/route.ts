import ky from "ky";
import { NextResponse } from "next/server";
import { NpmRegistryReplicateRootResponseProps } from "./route-schema";

const NPM_REGISTRY_REPLICATE_URL = "https://replicate.npmjs.com/registry/";

export async function GET() {
  try {
    const { doc_count } = await ky
      .get(NPM_REGISTRY_REPLICATE_URL)
      .json<NpmRegistryReplicateRootResponseProps>();
    return NextResponse.json({ doc_count });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      {
        status: 500,
      },
    );
  }
}
