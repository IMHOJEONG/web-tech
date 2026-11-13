import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import {
  verifyBrowserRuntime,
  type BrowserLauncher,
} from "./check-browser-runtime.mts";

const require = createRequire(
  new URL("../apps/docs-backend/package.json", import.meta.url),
);
const { parse } = require("yaml") as { parse(source: string): unknown };
const docsRequire = createRequire(
  new URL("../apps/docs/package.json", import.meta.url),
);
const { version } = docsRequire("@playwright/test/package.json") as {
  version: string;
};
type Step = {
  name?: string;
  run?: string;
  if?: string;
  "continue-on-error"?: boolean;
  "timeout-minutes"?: number;
};
type Job = {
  container?: { image: string; options: string };
  steps: Step[];
  "continue-on-error"?: boolean;
};
const workflow = parse(
  readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8"),
) as { jobs: Record<string, Job> };

test("all browser CI jobs use the same immutable image matching installed Playwright", () => {
  const images = new Set<string>();
  for (const id of ["shared-ui", "offline-reading", "docs-browser"]) {
    const job = workflow.jobs[id];
    assert.ok(job?.container, id);
    assert.match(
      job.container.image,
      new RegExp(
        `^mcr\\.microsoft\\.com/playwright:v${version.replaceAll(".", "\\.")}-noble@sha256:[a-f0-9]{64}$`,
      ),
    );
    assert.equal(job.container.options, "--init --ipc=host");
    images.add(job.container.image);
    const probe = job.steps.findIndex(
      (step) => step.run === "node scripts/check-browser-runtime.mts",
    );
    const install = job.steps.findIndex(
      (step) => step.run === "pnpm install --frozen-lockfile",
    );
    assert.ok(install >= 0 && probe > install, id);
    const step = job.steps[probe];
    assert.ok(step);
    assert.equal(step["timeout-minutes"], 2);
    assert.equal(step.if, undefined);
    assert.equal(step["continue-on-error"], undefined);
    assert.equal(job["continue-on-error"], undefined);
    const suiteNames: Record<string, string> = {
      "shared-ui": "Run shared UI regression tests",
      "offline-reading":
        "Test explicit offline saving and disconnected reading",
      "docs-browser": "Run browser suite",
    };
    assert.ok(
      job.steps.findIndex((value) => value.name === suiteNames[id]) > probe,
    );
    assert.doesNotMatch(
      JSON.stringify(job.steps),
      /playwright install|apt-get|apt install|PLAYWRIGHT_SKIP/,
    );
  }
  assert.equal(images.size, 1);
});

function launcher(
  options: {
    failLaunch?: boolean;
    text?: string;
    failContent?: boolean;
    failClose?: boolean;
  } = {},
) {
  const calls: string[] = [];
  const runtime: BrowserLauncher = {
    async launch(value) {
      assert.deepEqual(value, { headless: true });
      calls.push("launch");
      if (options.failLaunch)
        throw new Error("missing browser or shared library");
      return {
        version: () => "synthetic-chromium",
        async newPage() {
          calls.push("page");
          return {
            async setContent(html) {
              calls.push("render");
              assert.equal(html, '<p id="ci-browser-probe">chromium-ready</p>');
              if (options.failContent) throw new Error("renderer failed");
            },
            async textContent(selector) {
              assert.equal(selector, "#ci-browser-probe");
              return options.text ?? "chromium-ready";
            },
          };
        },
        async close() {
          calls.push("close");
          if (options.failClose) throw new Error("cleanup failed");
        },
      };
    },
  };
  return { runtime, calls };
}

test("runtime readiness requires a real render and closes the browser", async () => {
  const { runtime, calls } = launcher();
  assert.equal(await verifyBrowserRuntime(runtime), "synthetic-chromium");
  assert.deepEqual(calls, ["launch", "page", "render", "close"]);
});

test("missing executables or system dependencies fail without a download fallback", async () => {
  const { runtime, calls } = launcher({ failLaunch: true });
  await assert.rejects(
    verifyBrowserRuntime(runtime),
    /missing browser or shared library/,
  );
  assert.deepEqual(calls, ["launch"]);
});

test("render failures and incorrect content remain failures after cleanup", async () => {
  for (const options of [{ failContent: true }, { text: "not-ready" }]) {
    const { runtime, calls } = launcher(options);
    await assert.rejects(
      verifyBrowserRuntime(runtime),
      /renderer failed|did not render/,
    );
    assert.equal(calls.at(-1), "close");
  }
});

test("cleanup failure cannot report a successful runtime", async () => {
  await assert.rejects(
    verifyBrowserRuntime(launcher({ failClose: true }).runtime),
    /cleanup failed/,
  );
});

test("a cleanup error preserves the preceding render failure", async () => {
  await assert.rejects(
    verifyBrowserRuntime(
      launcher({ failContent: true, failClose: true }).runtime,
    ),
    (error: unknown) => {
      assert.ok(error instanceof AggregateError);
      assert.deepEqual(
        error.errors.map((value: Error) => value.message),
        ["renderer failed", "cleanup failed"],
      );
      return true;
    },
  );
});
