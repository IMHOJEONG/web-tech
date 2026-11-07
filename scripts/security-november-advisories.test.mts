import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const local = (app: string) =>
  createRequire(join(root, "apps", app, "package.json"));
const dependency = (parent: NodeJS.Require, name: string) =>
  createRequire(parent.resolve(name));
const docs = local("docs");
const backend = local("docs-backend");
const yaml = backend("yaml");
const semver = docs("next/dist/compiled/semver");
const floors = {
  glob: ">=14.0.2 <15",
  minimatch: ">=11.0.1 <12",
  seroval: ">=1.6.11 <2",
  qs: ">=6.16.1 <7",
  "@hono/node-server": ">=2.1.3 <3",
};
const isBetterAuthPackage = (key: string) =>
  /^(?:better-auth@|@better-auth\/)/.test(key);

function version(request: NodeJS.Require, name: string): string {
  let directory = dirname(request.resolve(name));
  while (directory !== dirname(directory)) {
    try {
      const metadata = JSON.parse(
        readFileSync(join(directory, "package.json"), "utf8"),
      );
      if (metadata.name === name) return metadata.version;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    directory = dirname(directory);
  }
  throw new Error(`Missing package: ${name}`);
}

test("November advisory floors reject vulnerable releases and prereleases in every locked copy", () => {
  const workspace = yaml.parse(
    readFileSync(join(root, "pnpm-workspace.yaml"), "utf8"),
  );
  const lock = yaml
    .parseAllDocuments(readFileSync(join(root, "pnpm-lock.yaml"), "utf8"))
    .at(-1)!
    .toJSON();
  for (const [name, range] of Object.entries(floors)) {
    const minimum = semver.minVersion(range).version;
    assert.equal(semver.satisfies(`${minimum}-rc.1`, range), false);
    assert.ok(
      semver.subset(workspace.overrides[name], range),
      `${name}: unsafe override`,
    );
    const copies = Object.keys(lock.packages).filter((key) =>
      key.startsWith(`${name}@`),
    );
    assert.ok(copies.length, `${name}: missing installed coverage`);
    for (const key of copies)
      assert.ok(semver.satisfies(key.slice(name.length + 1), range), key);
  }
  assert.ok(
    semver.subset(
      workspace.overrides["babel-plugin-istanbul@7.0.1>test-exclude"],
      ">=8.0.0 <9",
    ),
  );
  assert.equal(workspace.overrides["test-exclude"], undefined);
  const coverageCopies = Object.keys(lock.packages).filter((key) =>
    key.startsWith("test-exclude@"),
  );
  assert.ok(coverageCopies.length);
  for (const key of coverageCopies)
    assert.ok(
      semver.satisfies(key.slice("test-exclude@".length), ">=8.0.0 <9"),
      key,
    );
});

test("unused Better Auth and adapters have no importer, source or locked package remaining", () => {
  const metadata = JSON.parse(
    readFileSync(join(root, "apps/docs/package.json"), "utf8"),
  );
  assert.equal(metadata.dependencies["better-auth"], undefined);
  const lock = yaml
    .parseAllDocuments(readFileSync(join(root, "pnpm-lock.yaml"), "utf8"))
    .at(-1)!
    .toJSON();
  assert.equal(Object.keys(lock.packages).some(isBetterAuthPackage), false);
  const files = execFileSync("git", ["ls-files", "-z", "apps/docs"], {
    cwd: root,
    encoding: "utf8",
  })
    .split("\0")
    .filter((file) => /\.(?:[cm]?[jt]sx?)$/.test(file));
  for (const file of files)
    assert.doesNotMatch(
      readFileSync(join(root, file), "utf8"),
      /["']better-auth(?:\/[^"']*)?["']/,
      file,
    );
});

test("Better Auth detection matches complete package identities, not unrelated prefixes", () => {
  for (const key of [
    "better-auth@1.7.0",
    "@better-auth/core@1.7.0",
    "@better-auth/drizzle-adapter@1.7.0",
  ])
    assert.equal(isBetterAuthPackage(key), true, key);
  for (const key of [
    "better-auth-foo@1.0.0",
    "better-authenticate@1.0.0",
    "@example/better-auth@1.7.0",
  ])
    assert.equal(isBetterAuthPackage(key), false, key);
});

for (const app of ["docs-backend", "vuln-radar-backend"]) {
  test(`${app}: installed Express qs handles hostile comma entries and normal queries`, () => {
    const platform = dependency(local(app), "@nestjs/platform-express");
    const express = dependency(platform, "express");
    assert.ok(semver.satisfies(version(express, "qs"), floors.qs));
    const qs = express("qs");
    for (const encodeValuesOnly of [true, false]) {
      assert.doesNotThrow(() =>
        qs.stringify(
          { a: [{ toString: "fixture" }, "safe"] },
          { arrayFormat: "comma", encodeValuesOnly },
        ),
      );
    }
    assert.equal(
      qs.stringify({ a: ["one", "two"] }, { arrayFormat: "comma" }),
      "a=one%2Ctwo",
    );
    assert.deepEqual(qs.parse("a=one&a=two"), { a: ["one", "two"] });
    assert.equal(({} as Record<string, unknown>).polluted, undefined);
  });
}

test("TanStack Seroval does not serialize a typed array's own constructor name", () => {
  const router = dependency(local("vuln-radar"), "@tanstack/react-router");
  const core = dependency(router, "@tanstack/router-core");
  const seroval = core("seroval");
  assert.ok(semver.satisfies(version(core, "seroval"), floors.seroval));
  const bytes = new Uint8Array([1, 2, 3]);
  Object.defineProperty(bytes, "constructor", {
    value: { name: "UNTRUSTED_CONSTRUCTOR_FIXTURE" },
  });
  // Inspect generated source only; never evaluate untrusted serialized JavaScript.
  for (const source of [
    seroval.serialize(bytes),
    seroval.crossSerialize(bytes, { scopeId: "fixture" }),
  ]) {
    assert.doesNotMatch(source, /UNTRUSTED_CONSTRUCTOR_FIXTURE/);
    assert.match(source, /Uint8Array/);
  }
  assert.deepEqual(
    seroval.fromJSON(seroval.toJSON(bytes)),
    new Uint8Array([1, 2, 3]),
  );
});

test("Seroval RegExp output cannot close an inline script and retains modern regex syntax", async () => {
  const router = dependency(local("vuln-radar"), "@tanstack/react-router");
  const core = dependency(router, "@tanstack/router-core");
  const seroval = core("seroval");
  const regexp = new RegExp("[</script>](?<label>fixture)");
  for (const source of [
    seroval.serialize(regexp),
    await seroval.serializeAsync(regexp),
  ])
    assert.doesNotMatch(source, /<\/script/i);
  const restored = seroval.fromJSON(seroval.toJSON(regexp));
  assert.equal(restored.source, regexp.source);
  assert.equal(restored.flags, regexp.flags);
});

test("Prisma's actual node static adapter does not decode into a protected prefix", async () => {
  const prisma = createRequire(
    local("vuln-radar-backend").resolve("prisma/package.json"),
  );
  const dev = dependency(prisma, "@prisma/dev");
  assert.ok(
    semver.satisfies(
      version(dev, "@hono/node-server"),
      floors["@hono/node-server"],
    ),
  );
  const { Hono } = dev("hono");
  const { serveStatic } = dev("@hono/node-server/serve-static");
  const directory = await import("node:fs/promises");
  const temporary = await directory.mkdtemp(
    join((await import("node:os")).tmpdir(), "node-static-security-"),
  );
  try {
    await directory.mkdir(join(temporary, "files/private"), {
      recursive: true,
    });
    await directory.mkdir(join(temporary, "files/public"), { recursive: true });
    await directory.writeFile(
      join(temporary, "files/private/fixture.txt"),
      "PRIVATE_SYNTHETIC_MARKER",
    );
    await directory.writeFile(
      join(temporary, "files/public/fixture.txt"),
      "public fixture",
    );
    const app = new Hono();
    app.use(
      "/files/private/*",
      (c: { text: (text: string, status: number) => Response }) =>
        c.text("denied", 401),
    );
    app.use("/files/*", serveStatic({ root: temporary }));
    assert.equal((await app.request("/files/private/fixture.txt")).status, 401);
    const encoded = await app.request("/files/%%37%30rivate/fixture.txt");
    assert.equal(encoded.status, 404);
    assert.doesNotMatch(await encoded.text(), /PRIVATE_SYNTHETIC_MARKER/);
    const normal = await app.request("/files/public/fixture.txt");
    assert.equal(normal.status, 200);
    assert.equal(await normal.text(), "public fixture");
  } finally {
    await directory.rm(temporary, { recursive: true, force: true });
  }
});

/** Bound synthetic inputs and discard inherited runtime hooks and credentials. */
function runFixture(mode: string, app = "docs-backend") {
  const result = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--max-old-space-size=128",
      join(root, "scripts/security-fixtures/november-parsers.mts"),
      mode,
      join(root, "apps", app, "package.json"),
    ],
    {
      timeout: mode === "coverage" ? 30_000 : 8000,
      encoding: "utf8",
      maxBuffer: 64 * 1024,
      env: Object.fromEntries(
        Object.entries(process.env).filter(([key]) =>
          /^(PATH|HOME|TMPDIR|LANG|LC_ALL|SystemRoot)$/.test(key),
        ),
      ),
    },
  );
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /bounded fixture completed/);
}

for (const mode of ["minimatch", "glob"]) {
  test(`${mode}: bounded isolated regression rejects amplification or post-abort traversal`, () => {
    runFixture(mode);
  });
}

for (const app of ["docs-backend", "vuln-radar-backend"]) {
  test(`${app}: installed Jest collects cold coverage and retains file exclusions`, () => {
    runFixture("coverage", app);
  });
}
