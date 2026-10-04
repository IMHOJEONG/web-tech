import { cp, mkdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
await rm(new URL("../dist", import.meta.url), { recursive: true, force: true });
const result = spawnSync(
  process.execPath,
  [require.resolve("typescript/bin/tsc"), "-p", "tsconfig.build.json"],
  { cwd: root, stdio: "inherit" },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
await mkdir(new URL("../dist/styles", import.meta.url), { recursive: true });
await cp(
  new URL("../../tailwind-config/shared-styles.css", import.meta.url),
  new URL("../dist/styles/tokens.css", import.meta.url),
);
await cp(
  new URL("../src/styles/package.css", import.meta.url),
  new URL("../dist/styles/index.css", import.meta.url),
);
