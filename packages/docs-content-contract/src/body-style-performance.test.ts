import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("bounds heading validation on long near-matches in an isolated process", () => {
  // A separate process can be killed even when a regressed regexp blocks its event loop.
  const probe = `
    import assert from "node:assert/strict";
    const { getMarkdownBodyStyleIssues } = await import(process.argv[1]);
    const metadata = { status: "published", slug: "example" };
    const padding = " ".repeat(250_000);
    for (const separator of ["\\r", "\\u2028", "\\u2029"]) {
      for (const body of [
        "## " + padding + "word" + separator + "rest",
        "## word" + padding + separator + "rest",
      ]) {
        assert.deepEqual(getMarkdownBodyStyleIssues(body, metadata), {
          failures: [],
          warnings: ["published content should include at least one heading"],
        });
      }
    }
    for (const body of ["## " + padding + "Topic" + padding, "## " + padding]) {
      assert.deepEqual(getMarkdownBodyStyleIssues(body, metadata), {
        failures: [], warnings: [],
      });
    }
    console.log("8 adversarial and long-heading cases passed");
  `;
  const result = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      probe,
      new URL("./body-style.ts", import.meta.url).href,
    ],
    { encoding: "utf8", timeout: 10_000, maxBuffer: 64 * 1024 },
  );

  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /8 adversarial and long-heading cases passed/);
});
