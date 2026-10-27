import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const SECURITY_FLOOR_PARTS = [24, 22, 1] as const;
export const NODE_SECURITY_FLOOR = SECURITY_FLOOR_PARTS.join(".");

export function assertNodeRuntime(version: string): void {
  const match = /^v?(24)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(version);
  const minor = match ? Number(match[2]) : -1;
  const patch = match ? Number(match[3]) : -1;
  const [, floorMinor, floorPatch] = SECURITY_FLOOR_PARTS;
  if (
    !match ||
    !Number.isSafeInteger(minor) ||
    !Number.isSafeInteger(patch) ||
    minor < floorMinor ||
    (minor === floorMinor && patch < floorPatch)
  ) {
    throw new Error(
      `Node.js ${version} is unsupported. Use stable Node 24 >= ${NODE_SECURITY_FLOOR}; run mise install in this repository.`,
    );
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    assertNodeRuntime(process.version);
    console.log(
      `Node.js ${process.version}: security floor ${NODE_SECURITY_FLOOR} verified`,
    );
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Node runtime check failed",
    );
    process.exitCode = 1;
  }
}
