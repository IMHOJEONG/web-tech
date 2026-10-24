import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const backend = createRequire(join(root, "apps/docs-backend/package.json"));
const { parse } = backend("yaml");
const { satisfies } = createRequire(
  backend.resolve("@nestjs/cli/package.json"),
)("semver");
const config = parse(readFileSync(join(root, "pnpm-workspace.yaml"), "utf8"));
const radar = createRequire(join(root, "apps/vuln-radar/package.json"));
const docs = createRequire(join(root, "apps/docs/package.json"));
const exceptions = {
  "@vitejs/plugin-react@5.2.0>vite": "1.4.0",
  "@vitest/mocker@5.0.5>vite": "1.4.0",
  "vitest@5.0.5>vite": "1.4.0",
};

function manifest(request: NodeJS.Require, name: string) {
  let directory = dirname(request.resolve(name));
  while (directory !== dirname(directory)) {
    try {
      const metadata = JSON.parse(
        readFileSync(join(directory, "package.json"), "utf8"),
      );
      if (metadata.name === name) return metadata;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    directory = dirname(directory);
  }
  throw new Error(`Cannot locate ${name}`);
}

function assertReviewedCore(name: string, version: string, bundled: string) {
  assert.equal(name, "@voidzero-dev/vite-plus-core");
  assert.equal(version, "1.4.0");
  assert.equal(bundled, "8.3.5");
}

test("dependency changes retain the reviewed override and peer policy", () => {
  for (const broad of ["postcss", "nanoid", "@babel/core"])
    assert.ok(!(broad in config.overrides));
  assert.equal(config.overrides["nanoid@"], "3.3.20");
  assert.equal(config.overrides["@babel/core@"], "7.29.6");
  assert.deepEqual(config.peerDependencyRules, { allowedVersions: exceptions });
  assert.deepEqual(config.packageExtensions, {
    "styled-jsx@5.1.6": { peerDependencies: { "@babel/core": "^7.29.6" } },
  });
});

test("alias exceptions only cover the exact reviewed core and shared module identity", () => {
  const core = radar("vite/package.json");
  assertReviewedCore(core.name, core.version, core.bundledVersions.vite);
  const vp = createRequire(radar.resolve("vite-plus"));
  for (const [request, name, version] of [
    [radar, "@vitejs/plugin-react", "5.2.0"],
    [vp, "@vitest/mocker", "5.0.5"],
    [vp, "vitest", "5.0.5"],
  ] as const) {
    const consumer = createRequire(request.resolve(name));
    assert.equal(manifest(request, name).version, version);
    assert.equal(consumer.resolve("vite"), radar.resolve("vite"));
    assert.ok(
      satisfies(
        core.bundledVersions.vite,
        manifest(request, name).peerDependencies.vite,
      ),
    );
  }
});

test("an unreviewed alias cannot silently inherit the compatibility exception", () => {
  assert.throws(() => assertReviewedCore("vite", "1.4.0", "8.3.5"));
  assert.throws(() =>
    assertReviewedCore("@voidzero-dev/vite-plus-core", "1.4.1", "8.3.5"),
  );
  assert.throws(() =>
    assertReviewedCore("@voidzero-dev/vite-plus-core", "1.4.0", "8.4.0"),
  );
});

test("PostCSS consumers retain their own ranges and CommonJS-compatible nanoid", () => {
  const next = createRequire(docs.resolve("next/package.json"));
  const consumers = [
    [radar, "vite"],
    [docs, "next"],
    [docs, "sanitize-html"],
    [docs, "@tailwindcss/postcss"],
  ] as const;
  for (const [request, name] of consumers) {
    const metadata =
      name === "vite" ? request("vite/package.json") : manifest(request, name);
    const consumer = createRequire(request.resolve(name));
    const version = consumer("postcss/package.json").version;
    assert.ok(
      satisfies(version, metadata.dependencies.postcss),
      `${name}: ${version} must satisfy ${metadata.dependencies.postcss}`,
    );
    assert.ok(satisfies(version, ">=8.5.23 <9"));
    const postcss = createRequire(consumer.resolve("postcss/package.json"));
    const nanoid = postcss("nanoid/package.json").version;
    assert.ok(satisfies(nanoid, postcss("./package.json").dependencies.nanoid));
    assert.ok(satisfies(nanoid, ">=3.3.18 <4"));
    assert.equal(typeof postcss("nanoid/non-secure").nanoid, "function");
  }
  assert.equal(typeof next("postcss"), "function");
});

test("styled-jsx can actually transform using its resolved patched Babel 7", () => {
  const next = createRequire(docs.resolve("next/package.json"));
  const styled = createRequire(next.resolve("styled-jsx/package.json"));
  const babel = styled("@babel/core");
  assert.ok(satisfies(babel.version, ">=7.29.6 <8"));
  const result = babel.transformSync(
    "const view = <><p>hello</p><style jsx>{`p { color: red; }`}</style></>",
    {
      babelrc: false,
      configFile: false,
      plugins: [next.resolve("styled-jsx/babel")],
      parserOpts: { plugins: ["jsx"] },
    },
  );
  assert.match(result.code, /jsx-/);
});

test("convergence pins do not claim compatibility with different requested majors", () => {
  assert.ok(satisfies(config.overrides["nanoid@"], "^3.3.20"));
  assert.ok(!satisfies(config.overrides["nanoid@"], "^5"));
  assert.ok(satisfies(config.overrides["@babel/core@"], "^7.29.0"));
  assert.ok(!satisfies(config.overrides["@babel/core@"], "^8"));
});
