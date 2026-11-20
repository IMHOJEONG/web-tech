import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = process.env.EFFECT_SECURITY_WORKSPACE
  ? resolve(process.env.EFFECT_SECURITY_WORKSPACE)
  : resolve(here, "..");
const local = (app: string) =>
  createRequire(join(root, "apps", app, "package.json"));
const frontend = local("vuln-radar");
const prisma = createRequire(
  local("vuln-radar-backend").resolve("prisma/package.json"),
);
const config = createRequire(prisma.resolve("@prisma/config"));
const yaml = local("docs-backend")("yaml");
const semver = local("docs")("next/dist/compiled/semver");
const floor = ">=3.22.1 <4";
const consumers = [
  ["vuln-radar", frontend],
  ["Prisma config", config],
] as const;

test("Effect catalog, major-scoped override and every locked copy satisfy the security floor", () => {
  const workspace = yaml.parse(
    readFileSync(join(root, "pnpm-workspace.yaml"), "utf8"),
  );
  const lock = yaml
    .parseAllDocuments(readFileSync(join(root, "pnpm-lock.yaml"), "utf8"))
    .at(-1)!
    .toJSON();
  assert.ok(semver.subset(workspace.catalogs.web.effect, floor));
  assert.ok(semver.subset(workspace.overrides["effect@^3"], floor));
  assert.equal(workspace.overrides.effect, undefined);
  assert.equal(semver.satisfies("3.22.0", floor), false);
  assert.equal(semver.satisfies("3.22.1-rc.1", floor), false);
  assert.equal(semver.satisfies("4.0.0", floor), false);
  for (const section of [lock.packages, lock.snapshots]) {
    const copies = Object.keys(section).filter((key) =>
      key.startsWith("effect@"),
    );
    assert.ok(copies.length > 0);
    for (const copy of copies)
      assert.ok(semver.satisfies(copy.slice("effect@".length), floor), copy);
  }
  assert.equal(
    lock.catalogs.web.effect.specifier,
    workspace.catalogs.web.effect,
  );
  assert.ok(semver.satisfies(lock.catalogs.web.effect.version, floor));
  assert.equal(lock.overrides["effect@^3"], workspace.overrides["effect@^3"]);
  assert.ok(
    semver.satisfies(
      lock.importers["apps/vuln-radar"].dependencies.effect.version,
      floor,
    ),
  );
});

for (const [name, request] of consumers) {
  test(`${name}: installed Effect satisfies the floor`, () => {
    const metadata = request("effect/package.json");
    assert.ok(semver.satisfies(metadata.version, floor), metadata.version);
    if (metadata.engines?.node)
      assert.ok(semver.satisfies(process.versions.node, metadata.engines.node));
  });

  test(`${name}: bounded TemplateLiteral regression retains normal decoding`, () => {
    const result = spawnSync(
      process.execPath,
      [
        "--experimental-strip-types",
        "--max-old-space-size=128",
        join(here, "security-fixtures/effect-template-literal.mts"),
        request.resolve("effect/package.json"),
      ],
      {
        timeout: 8_000,
        killSignal: "SIGKILL",
        encoding: "utf8",
        maxBuffer: 64 * 1024,
        env: Object.fromEntries(
          Object.entries(process.env).filter(([key]) =>
            /^(PATH|HOME|TMPDIR|LANG|LC_ALL|SystemRoot)$/.test(key),
          ),
        ),
      },
    );
    assert.match(result.stdout, /effect fixture loaded: [0-9.]+/);
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /bounded fixture completed/);
  });
}

test("Prisma defineConfig accepts a normal schema with the patched transitive Effect", () => {
  const { defineConfig } = prisma("@prisma/config");
  const value = defineConfig({ schema: "synthetic/schema.prisma" });
  assert.equal(value.schema, "synthetic/schema.prisma");
});
