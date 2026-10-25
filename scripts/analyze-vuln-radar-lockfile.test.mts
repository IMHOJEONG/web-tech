import assert from "node:assert/strict";
import test from "node:test";
import {
  collectGraph,
  compareGraphs,
  type Lock,
} from "./analyze-vuln-radar-lockfile.mts";

const lock = (reference: string, snapshots: Lock["snapshots"]): Lock => ({
  importers: {
    "apps/app": { dependencies: { a: { specifier: "1", version: reference } } },
  },
  snapshots,
});

test("peer suffix changes alone do not invent package or edge changes", () => {
  const result = compareGraphs(
    lock("1(peer@1)", { "a@1(peer@1)": {} }),
    lock("1(peer@2)", { "a@1(peer@2)": {} }),
    "apps/app",
    true,
  );
  assert.deepEqual(result.added, []);
  assert.deepEqual(result.changedEdges, []);
});

test("a newly satisfied optional peer is a real edge even if that package was reachable elsewhere", () => {
  const result = compareGraphs(
    lock("1", {
      "a@1": { dependencies: { c: "1" } },
      "c@1": { dependencies: { b: "1" } },
      "b@1": {},
    }),
    lock("1", {
      "a@1": { dependencies: { c: "1" }, optionalDependencies: { b: "1" } },
      "c@1": { dependencies: { b: "1" } },
      "b@1": {},
    }),
    "apps/app",
    false,
  );
  assert.deepEqual(result.added, []);
  assert.equal(result.changedEdges[0]?.package, "a@1");
  assert.equal(
    result.changedEdges[0]?.changes[0]?.edge,
    "optionalDependencies:b",
  );
});

test("aliases resolve by actual snapshot identity rather than requested name", () => {
  const graph = collectGraph(
    lock("@vendor/core@1(peer@2)", { "@vendor/core@1(peer@2)": {} }),
    "apps/app",
    true,
  );
  assert.ok(graph.nodes.has("@vendor/core@1"));
  assert.deepEqual(graph.unresolved, []);
});

test("linked workspace production dependencies are traversed without its dev tools", () => {
  const input: Lock = {
    importers: {
      "apps/app": {
        dependencies: {
          ui: { specifier: "workspace:*", version: "link:../../packages/ui" },
        },
      },
      "packages/ui": {
        dependencies: { a: { specifier: "1", version: "1" } },
        devDependencies: { tool: { specifier: "1", version: "1" } },
      },
    },
    snapshots: { "a@1": {}, "tool@1": {} },
  };
  const graph = collectGraph(input, "apps/app", true);
  assert.ok(graph.nodes.has("a@1"));
  assert.ok(!graph.nodes.has("tool@1"));
});

test("dev dependencies remain separate and unresolved targets are reported", () => {
  const input = lock("1", { "a@1": {} });
  input.importers["apps/app"]!.devDependencies = {
    missing: { specifier: "2", version: "2" },
  };
  assert.deepEqual(collectGraph(input, "apps/app", false).unresolved, []);
  assert.deepEqual(collectGraph(input, "apps/app", true).unresolved, [
    "apps/app:missing@2",
  ]);
});

test("cycles terminate and a transitive version upgrade is retained", () => {
  const before = lock("1", {
    "a@1": { dependencies: { b: "1" } },
    "b@1": { dependencies: { a: "1" } },
  });
  const after = lock("1", {
    "a@1": { dependencies: { b: "2" } },
    "b@2": { dependencies: { a: "1" } },
  });
  const result = compareGraphs(before, after, "apps/app", false);
  assert.deepEqual(result.added, ["b@2"]);
  assert.deepEqual(result.removed, ["b@1"]);
});
