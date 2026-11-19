import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { syntheticDocuments } from "./prepare-ci-docs-content.mts";

const root = new URL("../", import.meta.url);
const git = (...args: string[]) =>
  execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

test("migrated article sources are absent from the public Git index even with generated CI files", () => {
  const tracked = new Set(
    git("ls-files", "-z", "apps/docs/category", "apps/docs/data")
      .split("\0")
      .filter(Boolean),
  );
  for (const [file] of syntheticDocuments)
    assert.equal(
      tracked.has(`apps/docs/${file}`),
      false,
      "do not reintroduce migrated article originals",
    );
  // Remaining drafts and the archived alias were not authorized for retirement.
  for (const file of tracked) {
    if (!/\.(md|mdx)$/.test(file)) continue;
    const source = git("show", `:${file}`);
    assert.match(source, /^status: (draft|archived)\s*$/m);
  }
});

test("the migrated article asset set is not tracked as public application media", () => {
  const retired = [
    "category/fe/react/nextjs-test.png",
    ...[
      "completion",
      "local-architecture",
      "service-infrastructure",
      "stages",
    ].map((name) => `diagrams/http-response-${name}.png`),
    ...[
      "buffer-boundary",
      "decoder-flow-comparison",
      "runtime-deployment",
      "service-runtime-architecture",
    ].map((name) => `diagrams/node-brotli-${name}.png`),
    "diagrams/tcp-socket-endpoints.png",
    "diagrams/tcp-socket-packet-flow.png",
    "docs/blocked-aria-problem/problem1.png",
    "licenses/brotli-MIT.txt",
    "shadcn/thumbnail.webp",
    "v8/thumbnail.webp",
  ];
  const tracked = new Set(
    git("ls-files", "-z", "apps/docs/public").split("\0").filter(Boolean),
  );
  assert.equal(retired.length, 15);
  for (const file of retired)
    assert.equal(
      tracked.has(`apps/docs/public/${file}`),
      false,
      "article media must be supplied by the private release or synthetic tests",
    );
});
