import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs";
import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  assertPrivateBuild,
  assertPrivateIntegration,
  assertTrustedContentRun,
  assertApprovedContentRevision,
  assertPrivateSearch,
  parsePrivateRelease,
} from "./private-content-ci-policy.mts";

export async function verifyPrivateRuntime(appRoot: string) {
  assert.equal(!!process.env.DOCS_PRIVATE_CONTENT_SSH_KEY, false);
  const release = parsePrivateRelease(
    JSON.parse(
      fs.readFileSync(path.join(appRoot, "content-release.lock.json"), "utf8"),
    ),
  );
  const output = JSON.parse(
    fs.readFileSync(
      path.join(appRoot, ".next/required-server-files.json"),
      "utf8",
    ),
  );
  assertPrivateBuild(output.config.env, release.revision);
  const require = createRequire(path.join(appRoot, "package.json"));
  const listener = net.createServer();
  listener.listen(0, "127.0.0.1");
  await once(listener, "listening");
  const address = listener.address();
  assert.ok(address && typeof address !== "string");
  const port = address.port;
  await new Promise<void>((resolve, reject) =>
    listener.close((e) => (e ? reject(e) : resolve())),
  );
  const server = spawn(
    process.execPath,
    [
      require.resolve("next/dist/bin/next"),
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    {
      cwd: appRoot,
      env: { ...process.env, DOCS_CONTENT_SOURCE: "private-git" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let ready = false;
  let errorCount = 0;
  server.stdout.on("data", (chunk) => {
    ready ||= String(chunk).includes("Ready in");
  });
  server.stderr.on("data", () => {
    errorCount++;
  });
  try {
    for (let i = 0; !ready; i++) {
      assert.ok(i < 300 && server.exitCode === null);
      await new Promise((r) => setTimeout(r, 100));
    }
    const get = async (pathname: string) => {
      const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      });
      assert.equal(response.status, 200);
      return response.text();
    };
    assertPrivateSearch(JSON.parse(await get("/api/search")), release.routes);
    let articles = 0;
    for (const locale of ["ko", "en"]) {
      const found = new Set<string>();
      for (
        let page = 1;
        page <= Math.ceil(release.routes.length / 6) + 1 &&
        found.size < release.routes.length;
        page++
      ) {
        const html = await get(`/${locale}/docs?page=${page}`);
        assert.match(html, /data-testid="docs-index-results"/);
        for (const route of release.routes)
          if (html.includes(`href="/${locale}${route}"`)) found.add(route);
      }
      assert.equal(found.size, release.routes.length);
      for (const route of release.routes) {
        const html = await get(`/${locale}${route}`);
        assert.match(html, /<div[^>]+class="[^"]*mdx-wrapper\b/);
        articles++;
      }
    }
    assert.equal(
      errorCount,
      0,
      "runtime stderr must remain empty; raw diagnostics are not published",
    );
    return { articles, routes: release.routes.length };
  } finally {
    if (server.exitCode === null) {
      server.kill("SIGTERM");
      await once(server, "exit");
    }
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const event = JSON.parse(
      fs.readFileSync(process.env.GITHUB_EVENT_PATH!, "utf8"),
    );
    assertTrustedContentRun(process.env, event);
    assert.equal(process.env.DOCS_CONTENT_SOURCE, "private-git");
    assert.ok(process.env.DOCS_PRIVATE_CONTENT_SSH_KEY);
    const release = assertPrivateIntegration((file) =>
      fs.readFileSync(file, "utf8"),
    );
    assertApprovedContentRevision(event, release);
    // Capture output in memory: even build failures must not publish source text.
    const build = spawnSync("pnpm", ["--filter", "docs", "build"], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 16 * 1024 * 1024,
      timeout: 900000,
    });
    delete process.env.DOCS_PRIVATE_CONTENT_SSH_KEY;
    assert.equal(build.status, 0);
    const result = await verifyPrivateRuntime(path.resolve("apps/docs"));
    console.info("[docs.private_ci_verified]", result);
  } catch {
    delete process.env.DOCS_PRIVATE_CONTENT_SSH_KEY;
    console.error(
      "Private release verification failed; raw build/runtime output was not published and no deployment was performed.",
    );
    process.exitCode = 1;
  }
}
