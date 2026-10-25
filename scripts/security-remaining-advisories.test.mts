import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const request = (workspace: string) =>
  createRequire(join(root, workspace, "package.json"));
const dependency = (parent: NodeJS.Require, name: string) =>
  createRequire(parent.resolve(name));
const docs = request("apps/docs");
const backend = request("apps/docs-backend");
const semver = docs("next/dist/compiled/semver");
const yaml = backend("yaml");
const floors = {
  toml: ">=5.0.1 <6",
  zod: ">=4.6.6 <5",
  "body-parser": ">=2.4.0 <3",
  multer: ">=2.5.0 <3",
  "fast-uri": ">=4.2.3 <5",
};

function version(parent: NodeJS.Require, name: string): string {
  let dir = dirname(parent.resolve(name));
  while (dir !== dirname(dir)) {
    try {
      const metadata = JSON.parse(
        readFileSync(join(dir, "package.json"), "utf8"),
      );
      if (metadata.name === name) return metadata.version;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    dir = dirname(dir);
  }
  throw new Error(`Missing package metadata: ${name}`);
}

test("remaining advisory gates reject affected releases and prereleases", () => {
  const versions = ["5.0.0", "4.4.2", "2.3.0", "2.4.0", "4.2.1"];
  Object.values(floors).forEach((range, index) => {
    assert.equal(semver.satisfies(versions[index], range), false);
    const minimum = semver.minVersion(range).version;
    assert.equal(semver.satisfies(minimum, range), true);
    assert.equal(semver.satisfies(`${minimum}-rc.1`, range), false);
  });
});

test("all locked copies and override floors retain the five reviewed patch lanes", () => {
  const workspace = yaml.parse(
    readFileSync(join(root, "pnpm-workspace.yaml"), "utf8"),
  );
  const documents = yaml.parseAllDocuments(
    readFileSync(join(root, "pnpm-lock.yaml"), "utf8"),
  );
  for (const doc of documents) assert.deepEqual(doc.errors, []);
  const lock = documents.at(-1).toJSON();
  for (const [name, range] of Object.entries(floors)) {
    const override = workspace.overrides[name === "zod" ? "zod@^4" : name];
    assert.ok(
      semver.subset(override, range),
      `${name}: override must retain safe bounds`,
    );
    const versions = Object.keys(lock.packages)
      .filter((key) => key.startsWith(`${name}@`))
      .map((key) => key.slice(name.length + 1));
    assert.ok(versions.length > 0, `${name}: missing lockfile coverage`);
    for (const version of versions)
      assert.ok(semver.satisfies(version, range), `${name}@${version}`);
  }
});

function isolated(mode: string, workspace: string) {
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) =>
      /^(PATH|HOME|TMPDIR|LANG|LC_ALL|SystemRoot)$/.test(key),
    ),
  );
  const result = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--unhandled-rejections=strict",
      "--max-old-space-size=128",
      join(root, "scripts/security-fixtures/request-parsers.mts"),
      mode,
      join(root, workspace, "package.json"),
    ],
    { env, encoding: "utf8", timeout: 10000, maxBuffer: 1024 * 1024 },
  );
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /security fixture completed/);
}

test("MDX's TOML parser handles bounded paths and rejects oversized integers before conversion", () => {
  isolated("toml", "apps/docs");
});

for (const workspace of [
  "apps/docs",
  "apps/docs-backend",
  "apps/vuln-radar",
  "packages/docs-content-contract",
]) {
  test(`${workspace}: Zod preserves valid contracts and bounded collection rejection`, () => {
    const local = request(workspace);
    assert.ok(semver.satisfies(local("zod/package.json").version, floors.zod));
    const { z } = local("zod");
    const schema = z.object({
      title: z.string().min(1),
      tags: z.array(z.string()).max(8),
    });
    const value = { title: "fixture", tags: ["web", "security"] };
    assert.deepEqual(schema.parse(value), value);
    assert.equal(
      schema.safeParse({ ...value, tags: Array(32).fill(0) }).success,
      false,
    );
    assert.equal(schema.safeParse({ ...value, title: "" }).success, false);
  });
}

const cli = createRequire(backend.resolve("@nestjs/cli/package.json"));
const angular = dependency(cli, "@angular-devkit/core");
const ajv = dependency(angular, "ajv");
const uri = ajv("fast-uri");

test("installed parser paths use patched releases, not only a patched lockfile", () => {
  const mdx = dependency(docs, "mdx-bundler");
  const frontmatter = dependency(mdx, "remark-mdx-frontmatter");
  assert.ok(semver.satisfies(version(frontmatter, "toml"), floors.toml));
  assert.ok(semver.satisfies(version(ajv, "fast-uri"), floors["fast-uri"]));
  for (const name of ["docs-backend", "vuln-radar-backend"]) {
    const platform = dependency(
      request(`apps/${name}`),
      "@nestjs/platform-express",
    );
    const express = dependency(platform, "express");
    assert.ok(
      semver.satisfies(version(express, "body-parser"), floors["body-parser"]),
    );
    assert.ok(semver.satisfies(version(platform, "multer"), floors.multer));
  }
});

test("Ajv URI handling does not synthesize a scheme from percent-encoded input", () => {
  const input = "ht%74ps://example.invalid/path";
  assert.ok(uri.parse(input).error);
  assert.equal(uri.normalize(input), input);
  assert.equal(uri.equal(input, "https://example.invalid/path"), false);
  assert.throws(() => uri.resolve("https://example.invalid/base/", input));
});

test("Ajv URI handling preserves relative reference identity before resolution", () => {
  for (const [ref, normalized] of [
    ["../x", "../x"],
    ["a/../b", "b"],
  ]) {
    assert.equal(uri.normalize(ref), normalized);
    assert.equal(
      uri.resolve("https://example.invalid/base/", uri.normalize(ref)),
      uri.resolve("https://example.invalid/base/", ref),
    );
  }
  assert.equal(uri.equal("../x", "x"), false);
});

test("Ajv URI handling rejects ambiguous hosts instead of silently changing authority", () => {
  for (const input of [
    "https://a@b@other.invalid/",
    "https://ev\til.invalid/",
  ]) {
    assert.ok(uri.parse(input).error);
    assert.equal(uri.equal(input, input), false);
    assert.throws(() => uri.resolve("https://example.invalid/", input));
  }
});

test("suffix URI normalization escapes the first-segment colon and keeps safe references", () => {
  const options = { reference: "suffix", scheme: "x" };
  assert.equal(
    uri.normalize("javascript:fixture", options),
    "javascript%3Afixture",
  );
  assert.equal(uri.normalize("path/to/file", options), "path/to/file");
  assert.equal(uri.normalize("a/b:c", options), "a/b:c");
  const Ajv = angular("ajv");
  const valid = new Ajv().compile({
    type: "object",
    properties: { count: { type: "integer" } },
    required: ["count"],
  });
  assert.equal(valid({ count: 2 }), true);
  assert.equal(valid({ count: "two" }), false);
});

for (const app of ["docs-backend", "vuln-radar-backend"]) {
  test(`${app}: body-parser survives trailing compressed bytes without suppressing errors`, () => {
    isolated("body-parser", `apps/${app}`);
  });
  test(`${app}: multer survives a late asynchronous filter after teardown`, () => {
    isolated("multer", `apps/${app}`);
  });
}
