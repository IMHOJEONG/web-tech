import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = process.env.NEXT_SECURITY_WORKSPACE
  ? resolve(process.env.NEXT_SECURITY_WORKSPACE)
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const docsPackage = join(root, "apps/docs/package.json");
const docs = createRequire(docsPackage);
const next = createRequire(docs.resolve("next/package.json"));
const semver = docs("next/dist/compiled/semver");

// Preserve the Critical fixes and the later GHSA-mfr8-8qww-v76h cache fix.
function assertPatchedNext(version: string): void {
  assert.ok(
    semver.satisfies(version, ">=16.4.5 <17"),
    `Next ${version} must remain on the patched stable Next 16 lane`,
  );
}

test("Next security gate rejects affected and prerelease versions", () => {
  for (const version of [
    "16.3.8",
    "16.4.0",
    "16.4.1",
    "16.4.3",
    "16.4.4",
    "16.4.5-canary.0",
    "invalid",
  ])
    assert.throws(() => assertPatchedNext(version));
  for (const version of ["16.4.5", "16.4.6", "16.5.0"])
    assertPatchedNext(version);
});

test("docs resolves patched Next and the matching MDX plugin", () => {
  const metadata = docs("next/package.json");
  const version = metadata.version;
  assertPatchedNext(version);
  assert.ok(semver.satisfies(process.versions.node, metadata.engines.node));
  assert.equal(docs("@next/mdx/package.json").version, version);
  assert.equal(next("@next/env/package.json").version, version);
});

test("no catalog or locked Next runtime can reinstall the affected lane", () => {
  const yaml = createRequire(join(root, "apps/docs-backend/package.json"))(
    "yaml",
  );
  const workspace = yaml.parse(
    readFileSync(join(root, "pnpm-workspace.yaml"), "utf8"),
  );
  for (const [catalog, definitions] of Object.entries(workspace.catalogs) as [
    string,
    Record<string, string>,
  ][]) {
    for (const name of ["next", "@next/mdx"]) {
      const range = definitions[name];
      if (range !== undefined)
        assert.ok(
          semver.subset(range, ">=16.4.5 <17"),
          `${catalog}.${name}: ${range}`,
        );
    }
  }
  const documents = yaml.parseAllDocuments(
    readFileSync(join(root, "pnpm-lock.yaml"), "utf8"),
  );
  for (const document of documents) assert.deepEqual(document.errors, []);
  const lock = documents.at(-1).toJSON();
  const versions = Object.keys(lock.packages)
    .filter((key) => /^(?:next|@next\/(?:env|mdx|swc-[^@]+))@/.test(key))
    .map((key) => key.slice(key.lastIndexOf("@") + 1));
  assert.ok(versions.length > 0);
  versions.forEach(assertPatchedNext);
});

test("Next image pipeline resolves the reviewed sharp mitigation", async () => {
  const sharp = next("sharp");
  assert.ok(semver.satisfies(sharp.versions.sharp, ">=0.35.5 <0.36"));
  const svg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="3" height="2"><rect width="3" height="2" fill="orange"/></svg>',
  );
  const image = await sharp(svg).webp().toBuffer();
  const result = await sharp(image).metadata();
  assert.equal(result.format, "webp");
  assert.equal(result.width, 3);
  assert.equal(result.height, 2);
});

for (const mode of ["development", "production"]) {
  test(`Next Flight retains multiple bounded typed arrays (${mode})`, () => {
    const environment = Object.fromEntries(
      Object.entries(process.env).filter(([key]) =>
        /^(PATH|HOME|TMPDIR|LANG|LC_ALL|SystemRoot)$/.test(key),
      ),
    );
    const result = spawnSync(
      process.execPath,
      [
        "--conditions=react-server",
        "--input-type=module",
        "-e",
        `
          import assert from 'node:assert/strict';
          import { createRequire } from 'node:module';
          const request = createRequire(${JSON.stringify(docsPackage)});
          for (const bundler of ['webpack', 'turbopack']) {
            const { encodeReply } = request('next/dist/compiled/react-server-dom-' + bundler + '/client.node');
            const { decodeReply } = request('next/dist/compiled/react-server-dom-' + bundler + '/server.node');
            const backing = new Uint8Array([99, 11, 22, 33, 88]);
            const input = {
              bytes: backing.subarray(1, 4),
              words: new Uint16Array([256, 512]),
              empty: new Uint8Array(),
              label: 'bounded-fixture',
            };
            const decoded = await decodeReply(await encodeReply(input), {});
            assert.ok(decoded.bytes instanceof Uint8Array);
            assert.ok(decoded.words instanceof Uint16Array);
            assert.deepEqual([...decoded.bytes], [11, 22, 33]);
            assert.deepEqual([...decoded.words], [256, 512]);
            assert.deepEqual([...decoded.empty], []);
            assert.equal(decoded.label, input.label);
          }
          console.log('bounded typed-array round trips completed');
        `,
      ],
      {
        env: { ...environment, NODE_ENV: mode },
        encoding: "utf8",
        timeout: 10000,
        maxBuffer: 1024 * 1024,
      },
    );
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /bounded typed-array round trips completed/);
  });
}
