import { execFileSync } from "node:child_process";

export const HISTORICAL_ARTICLE_REVISION =
  "53ab14e54d2a892cb1cd64544965d00c185ccab9";
const paths = new Set([
  "apps/docs/data/canvas/readme.md",
  "apps/docs/data/v8/javascript-event-loop-runtime.mdx",
]);
const maxBytes = 8 * 1024 * 1024;

const readGitBlob = (object: string) =>
  execFileSync("git", ["show", object], {
    cwd: new URL("../", import.meta.url),
    encoding: "utf8",
    maxBuffer: maxBytes,
    stdio: ["ignore", "pipe", "pipe"],
  });

// Historical experiments read only these already-public blobs, never live content.
export function readHistoricalArticle(
  path: string,
  readBlob: (object: string) => string = readGitBlob,
): string {
  if (!paths.has(path)) throw new Error("Unsupported historical article path.");
  let source: string;
  try {
    source = readBlob(`${HISTORICAL_ARTICLE_REVISION}:${path}`);
  } catch {
    throw new Error(
      `Historical article unavailable: the local Git object for ${HISTORICAL_ARTICLE_REVISION} is required. No working-tree, network or private-content fallback is used.`,
    );
  }
  if (!source || Buffer.byteLength(source, "utf8") > maxBytes)
    throw new Error("Historical article must contain 1 byte to 8 MiB of text.");
  return source;
}
