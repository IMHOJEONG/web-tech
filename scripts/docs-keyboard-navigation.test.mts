import assert from "node:assert/strict";
import test from "node:test";
import { prepareSearchDestination } from "../apps/docs/e2e/helpers/docs-index.ts";

function request(status: number, html: string) {
  const paths: string[] = [];
  return {
    paths,
    client: {
      async get(path: string) {
        paths.push(path);
        return { status: () => status, text: async () => html };
      },
    } as Parameters<typeof prepareSearchDestination>[0],
  };
}

test("keyboard readiness requires the real locale/query destination and completed results", async () => {
  const fixture = request(
    200,
    '<main data-testid="docs-index-results"></main>',
  );
  await prepareSearchDestination(fixture.client, "en", "React & state");
  assert.deepEqual(fixture.paths, ["/en/docs?q=React+%26+state"]);
});

test("an HTTP error cannot be accepted as a warmed search destination", async () => {
  const fixture = request(
    503,
    '<main data-testid="docs-index-results"></main>',
  );
  await assert.rejects(() =>
    prepareSearchDestination(fixture.client, "ko", "react"),
  );
});

test("a streaming fallback or error shell is not completed destination readiness", async () => {
  for (const html of [
    "",
    '<main data-page-pending="docs"></main>',
    '<main role="alert">Unavailable</main>',
  ]) {
    const fixture = request(200, html);
    await assert.rejects(() =>
      prepareSearchDestination(fixture.client, "en", "react"),
    );
  }
});
