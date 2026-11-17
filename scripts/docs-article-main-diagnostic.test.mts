import assert from "node:assert/strict";
import test from "node:test";
import {
  actualMainCount,
  observeArticleMainFailure,
  parseArticleMainFailure,
} from "../apps/docs/scripts/article-main-diagnostic.ts";

const state = {
  actualCount: 2,
  roleCount: 1,
  domCount: 2,
  pendingCount: 0,
  bodyCount: 1,
  bodyVisible: true,
};

test("main diagnostic retains only bounded counts and readiness, not raw payloads", () => {
  assert.deepEqual(parseArticleMainFailure(state), state);
  assert.deepEqual(parseArticleMainFailure({ ...state, actualCount: null }), {
    ...state,
    actualCount: null,
  });
  for (const value of [-1, 1.5, 1001, NaN, Infinity, "2", undefined]) {
    assert.equal(
      parseArticleMainFailure({ ...state, domCount: value }),
      undefined,
    );
    assert.equal(
      parseArticleMainFailure({ ...state, actualCount: value }),
      undefined,
    );
  }
  assert.equal(
    parseArticleMainFailure({ ...state, message: "synthetic diagnostic text" }),
    undefined,
  );
  assert.equal(
    parseArticleMainFailure({ ...state, bodyVisible: "yes" }),
    undefined,
  );
});

test("matcher actual is separate from a later page snapshot", () => {
  assert.equal(
    actualMainCount({ matcherResult: { name: "toHaveCount", actual: 0 } }),
    0,
  );
  assert.equal(
    actualMainCount({ matcherResult: { name: "toHaveCount", actual: 2 } }),
    2,
  );
  for (const error of [
    {},
    null,
    { matcherResult: { name: "toBeVisible", actual: 2 } },
    { matcherResult: { name: "toHaveCount", actual: "2" } },
  ]) {
    assert.equal(actualMainCount(error), null);
  }
});

test("passing assertions do not run diagnostics or change outcomes", async () => {
  let calls = 0;
  await observeArticleMainFailure(
    async () => {
      calls++;
    },
    async () => {
      assert.fail("snapshot");
    },
    () => assert.fail("annotation"),
  );
  assert.equal(calls, 1);
});

test("a failed assertion stays failed with its original error and sanitized evidence", async () => {
  const original = new Error("synthetic assertion");
  const annotations: unknown[] = [];
  await assert.rejects(
    observeArticleMainFailure(
      async () => {
        throw original;
      },
      async () => state,
      (value) => {
        annotations.push(value);
      },
    ),
    (error) => error === original,
  );
  assert.deepEqual(annotations, [state]);
});

test("snapshot or annotation errors never replace the original failed assertion", async () => {
  const original = new Error("original synthetic assertion");
  for (const snapshot of [
    async () => {
      throw new Error("snapshot unavailable");
    },
    async () => ({ ...state, message: "rejected" }),
    async () => state,
  ]) {
    await assert.rejects(
      observeArticleMainFailure(
        async () => {
          throw original;
        },
        snapshot,
        () => {
          throw new Error("annotation unavailable");
        },
      ),
      (error) => error === original,
    );
  }
});
