import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const docs = createRequire(
  new URL("../apps/docs/package.json", import.meta.url),
);
const { getUpgradeAssessment } = docs(
  "next/dist/lib/upgrade/prepare-upgrade",
) as {
  getUpgradeAssessment(
    version: string,
    policy: "security",
  ): Promise<{
    affected: boolean | null;
    reference: string | null;
    upgrade: { status: string; targetVersion?: string };
  }>;
};
const semver = docs("next/dist/compiled/semver");
const registry = "https://registry.npmjs.org/";
const bulk = `${registry}-/npm/v1/security/advisories/bulk`;
// This tests the installed Next CLI's advisory classification, not exploitation.
const range = ">=16.3.0 <=16.4.4";
type FetchInput = Parameters<typeof globalThis.fetch>[0];
type FetchInit = Parameters<typeof globalThis.fetch>[1];

test("Next assessment identifies the affected version and selects a safe patch", async (t) => {
  const requests: string[] = [];
  t.mock.method(
    globalThis,
    "fetch",
    async (input: FetchInput, init?: FetchInit) => {
      const url = String(input);
      requests.push(url);
      if (url === bulk) {
        assert.equal(init?.method, "POST");
        const { next: versions } = JSON.parse(String(init?.body));
        assert.ok(Array.isArray(versions) && versions.length > 0);
        return Response.json(
          versions.some((version: string) => semver.satisfies(version, range))
            ? { next: [{ vulnerable_versions: range }] }
            : {},
        );
      }
      assert.equal(url, `${registry}next`);
      return Response.json({
        versions: Object.fromEntries(
          ["16.4.3", "16.4.4", "16.4.5", "16.4.6"].map((version) => [
            version,
            { version },
          ]),
        ),
      });
    },
  );
  const result = await getUpgradeAssessment("16.4.3", "security");
  assert.equal(result.affected, true);
  assert.equal(result.reference, bulk);
  assert.equal(result.upgrade.status, "ready");
  assert.equal(result.upgrade.targetVersion, "16.4.6");
  assert.deepEqual(requests, [bulk, `${registry}next`, bulk]);
});

test("patched Next is unaffected without fetching or proposing another release", async (t) => {
  const calls = t.mock.method(
    globalThis,
    "fetch",
    async (input: FetchInput, init?: FetchInit) => {
      assert.equal(String(input), bulk);
      assert.equal(init?.method, "POST");
      assert.deepEqual(JSON.parse(String(init?.body)), { next: ["16.4.6"] });
      return Response.json({});
    },
  );
  const result = await getUpgradeAssessment("16.4.6", "security");
  assert.equal(result.affected, false);
  assert.equal(result.upgrade.status, "unaffected");
  assert.equal(result.upgrade.targetVersion, undefined);
  assert.equal(calls.mock.callCount(), 1);
});

test("an advisory connection failure stays unknown rather than reporting safe", async (t) => {
  const calls = t.mock.method(globalThis, "fetch", async () => {
    throw new TypeError("synthetic registry connection failure");
  });
  const result = await getUpgradeAssessment("16.4.6", "security");
  assert.equal(result.affected, null);
  assert.equal(result.upgrade.status, "unknown");
  assert.equal(calls.mock.callCount(), 1);
});

test("an invalid advisory range stays unknown rather than reporting safe", async (t) => {
  const calls = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ next: [{ vulnerable_versions: "invalid fixture range" }] }),
  );
  const result = await getUpgradeAssessment("16.4.6", "security");
  assert.equal(result.affected, null);
  assert.equal(result.upgrade.status, "unknown");
  assert.equal(calls.mock.callCount(), 1);
});
