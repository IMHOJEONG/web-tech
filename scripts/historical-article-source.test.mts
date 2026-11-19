import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  HISTORICAL_ARTICLE_REVISION,
  readHistoricalArticle,
} from "./historical-article-source.mts";

const canvas = "apps/docs/data/canvas/readme.md";
const eventLoop = "apps/docs/data/v8/javascript-event-loop-runtime.mdx";
const root = new URL("../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");

test("both historical articles use the exact pre-retirement public revision", () => {
  assert.equal(
    HISTORICAL_ARTICLE_REVISION,
    "53ab14e54d2a892cb1cd64544965d00c185ccab9",
  );
  for (const path of [canvas, eventLoop]) {
    const objects: string[] = [];
    assert.equal(
      readHistoricalArticle(path, (object) => {
        objects.push(object);
        return "Synthetic historical text";
      }),
      "Synthetic historical text",
    );
    assert.deepEqual(objects, [`${HISTORICAL_ARTICLE_REVISION}:${path}`]);
  }
});

test("unsupported and traversal paths are rejected before the Git reader", () => {
  let calls = 0;
  for (const path of [
    "",
    "../article.md",
    "apps/docs/data/canvas/../canvas/readme.md",
    "apps/docs/data/canvas/readme.md\n",
    "HEAD:apps/docs/data/canvas/readme.md",
    "apps/docs/data/other.mdx",
  ])
    assert.throws(
      () => readHistoricalArticle(path, () => String(++calls)),
      /Unsupported historical article path/,
    );
  assert.equal(calls, 0);
});

test("missing Git objects fail once without falling back or exposing stderr", () => {
  let calls = 0;
  assert.throws(
    () =>
      readHistoricalArticle(canvas, () => {
        calls++;
        throw new Error("synthetic stderr that must not be exposed");
      }),
    (error: unknown) => {
      assert(error instanceof Error);
      assert.match(error.message, /local Git object/);
      assert.match(
        error.message,
        /No working-tree, network or private-content fallback/,
      );
      assert(!error.message.includes("synthetic stderr"));
      return true;
    },
  );
  assert.equal(calls, 1);
});

test("empty and byte-oversized historical blobs fail closed", () => {
  assert.throws(
    () => readHistoricalArticle(canvas, () => ""),
    /1 byte to 8 MiB/,
  );
  assert.throws(
    () => readHistoricalArticle(canvas, () => "\uAC00".repeat(3 * 1024 * 1024)),
    /1 byte to 8 MiB/,
  );
  const limit = "x".repeat(8 * 1024 * 1024);
  assert.equal(readHistoricalArticle(canvas, () => limit).length, limit.length);
});

test("all three reviewed reproductions use the historical reader rather than deleted files", () => {
  for (const file of [
    "2026-09-20-canvas-snippet.test.mjs",
    "2026-09-20-canvas-browser.mjs",
    "2026-09-22-event-loop-browser.test.mjs",
  ]) {
    const source = read(`docs/verification/artifacts/${file}`);
    assert.match(
      source,
      /import \{ readHistoricalArticle \} from "\.\.\/\.\.\/\.\.\/scripts\/historical-article-source\.mts"/,
    );
    assert.match(source, /const article = readHistoricalArticle\(/);
    assert.doesNotMatch(
      source,
      /readFileSync\([\s\S]{0,160}apps\/docs\/data\//,
    );
  }
});

test("reproduction reports state the pinned Git prerequisite, not a private fallback", () => {
  for (const path of [
    "docs/verification/content/2026-09-20-content-readability-review.md",
    "docs/verification/content/2026-09-22-event-loop-example.md",
  ]) {
    const report = read(path);
    assert(report.includes(HISTORICAL_ARTICLE_REVISION));
    assert.match(report, /git cat-file -e/);
    assert.match(report, /비공개 Git.*읽지 않/);
  }
});

test("production reproduction link targets the actual runbook heading", () => {
  const report = read(
    "docs/verification/content/2026-11-17-private-git-content.md",
  );
  const runbook = read("docs/runbooks/docs-private-git-content.md");
  assert(
    report.includes("../../runbooks/docs-private-git-content.md#4-운영-전환"),
  );
  assert(!report.includes("#4-production-전환"));
  assert.match(runbook, /^### 4\. 운영 전환$/m);
});
