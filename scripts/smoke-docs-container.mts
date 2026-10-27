import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

// Execute inside the image with --network none and a read-only bind of this file.
assert.equal(process.platform, "linux");
assert.equal(process.arch, "x64");
const directory = mkdtempSync("/tmp/node24-content-");
mkdirSync(join(directory, "web"));
writeFileSync(
  join(directory, "web/runtime.md"),
  `---
title: Node runtime smoke
slug: runtime
summary: Safe isolated image verification.
date: "2026-10-27"
updatedAt: "2026-10-27"
authorName: Test fixture
authorRole: Test
readMinutes: 1
topicLabel: WEB
status: published
tags: [nodejs]
---
## Runtime smoke

No external content or credentials.
`,
);
process.env.CONTENT_DIR = directory;
process.env.CONTENT_API_TOKEN = "node24-local-smoke-only";
const require = createRequire(join(process.cwd(), "package.json"));
const { NestFactory } = require("@nestjs/core");
const { AppModule } = require(join(process.cwd(), "dist/src/app.module.js"));
const app = await NestFactory.create(AppModule, { logger: false });
try {
  await app.listen(0, "127.0.0.1");
  const origin = await app.getUrl();
  const health = await fetch(`${origin}/health`, {
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(health.status, 200);
  await health.arrayBuffer();
  const denied = await fetch(`${origin}/api/posts`, {
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(denied.status, 401);
  await denied.arrayBuffer();
  const headers = { Authorization: "Bearer node24-local-smoke-only" };
  const posts = await fetch(`${origin}/api/posts`, {
    headers,
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(posts.status, 200);
  const data = await posts.json();
  assert.equal(data.results.length, 1);
  const article = await fetch(`${origin}/posts/web/runtime`, {
    headers,
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(article.status, 200);
  assert.match(article.headers.get("content-type") ?? "", /text\/html/);
  assert.match(await article.text(), /Runtime smoke/);
  console.log(
    JSON.stringify({
      node: process.version,
      arch: process.arch,
      health: health.status,
      unauthorized: denied.status,
      posts: posts.status,
      documents: data.results.length,
      html: article.status,
    }),
  );
} finally {
  await app.close();
  rmSync(directory, { recursive: true, force: true });
}
