import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const appRequire = (app) =>
  createRequire(join(root, "apps", app, "package.json"));
const dependencyRequire = (parent, name) => createRequire(parent.resolve(name));
const docs = appRequire("docs");

function packageVersion(parent, name) {
  let directory = dirname(parent.resolve(name));
  while (directory !== dirname(directory)) {
    try {
      const metadata = JSON.parse(
        readFileSync(join(directory, "package.json"), "utf8"),
      );
      if (metadata.name === name) return metadata.version;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    directory = dirname(directory);
  }
  throw new Error(`Cannot locate metadata for ${name}`);
}

function assertPatched(parent, name, minimum) {
  assertMinimumVersion(packageVersion(parent, name), minimum, name);
}

function assertMinimumVersion(version, minimum, name) {
  const actual = version.split(".").map(Number);
  const expected = minimum.split(".").map(Number);
  const difference = actual.findIndex(
    (value, index) => value !== expected[index],
  );
  assert.ok(
    difference === -1 || actual[difference] > expected[difference],
    `${name} must be >= ${minimum}`,
  );
}

for (const app of ["docs-backend", "vuln-radar-backend"]) {
  test(`${app}: mapped IPv6 proxy trust does not trust public IPv4 clients`, () => {
    const platform = dependencyRequire(
      appRequire(app),
      "@nestjs/platform-express",
    );
    const expressRequire = dependencyRequire(platform, "express");
    assertPatched(expressRequire, "proxy-addr", "2.0.8");
    const proxyAddress = expressRequire("proxy-addr");
    assert.equal(proxyAddress.compile("::ffff:10.0.0.0/8")("8.8.8.8"), false);
    const trust = proxyAddress.compile("::ffff:10.0.0.0/104");
    assert.equal(trust("10.1.2.3"), true);
    assert.equal(trust("::ffff:10.1.2.3"), true);
    assert.equal(trust("8.8.8.8"), false);
    assert.equal(platform("express")().get("trust proxy"), false);
  });
}

test("PostCSS retains a valid indexed source-map mapping", () => {
  const postcss = dependencyRequire(docs, "postcss");
  assertPatched(postcss, "source-map-js", "1.2.2");
  const { SourceMapGenerator, SourceMapConsumer } = postcss("source-map-js");
  const map = new SourceMapGenerator({ file: "output.css" });
  map.addMapping({
    generated: { line: 1, column: 0 },
    original: { line: 2, column: 0 },
    source: "input.css",
  });
  const consumer = new SourceMapConsumer({
    version: 3,
    sections: [{ offset: { line: 0, column: 0 }, map: map.toJSON() }],
  });
  let mapping;
  consumer.eachMapping((value) => {
    mapping = value;
  });
  assert.equal(mapping.source, "input.css");
  assert.equal(mapping.originalLine, 2);
});

test("Next image dependency converts a bounded SVG to WebP", async () => {
  const next = dependencyRequire(docs, "next");
  assertPatched(next, "sharp", "0.35.5");
  const sharp = next("sharp");
  const svg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="3"><rect width="2" height="3" fill="orange"/></svg>',
  );
  const image = await sharp(svg).webp().toBuffer();
  const metadata = await sharp(image).metadata();
  assert.equal(metadata.format, "webp");
  assert.equal(metadata.width, 2);
  assert.equal(metadata.height, 3);
  assert.ok(sharp.versions.rsvg, "Native SVG renderer must be present");
  assertMinimumVersion(sharp.versions.rsvg, "2.63.2", "librsvg");
});

test("TanStack seroval retains bounded typed-array round trips", () => {
  const router = dependencyRequire(
    appRequire("vuln-radar"),
    "@tanstack/react-router",
  );
  const core = dependencyRequire(router, "@tanstack/router-core");
  assertPatched(core, "seroval", "1.6.3");
  const seroval = core("seroval");
  const value = { bytes: new Uint8Array([1, 2, 3]), title: "fixture" };
  assert.deepEqual(seroval.fromJSON(seroval.toJSON(value)), value);
  assert.deepEqual(
    seroval.fromCrossJSON(seroval.toCrossJSON(value), { refs: new Map() }),
    value,
  );
  const malformed = seroval.toJSON(new Uint8Array([1, 2, 3]));
  malformed.t.f = seroval.toJSON(3).t;
  assert.throws(() => seroval.fromJSON(malformed));
  const malformedCross = seroval.toCrossJSON(new Uint8Array([1, 2, 3]));
  malformedCross.f = seroval.toCrossJSON(3);
  assert.throws(() =>
    seroval.fromCrossJSON(malformedCross, { refs: new Map() }),
  );
});

test("rehype-katex renders math using the tested patch without inherited trust", async () => {
  const rehype = dependencyRequire(docs, "rehype-katex");
  assert.equal(packageVersion(rehype, "katex"), "0.18.2");
  const katex = rehype("katex");
  // Keep the poisoned property on a fixture prototype, never Object.prototype.
  const options = Object.create({ trust: true });
  options.strict = "ignore";
  const output = katex.renderToString(
    "\\href{https://example.com}{x}",
    options,
  );
  assert.doesNotMatch(output, /<a\b/);
  const { default: rehypeKatex } = await import(
    pathToFileURL(docs.resolve("rehype-katex")).href
  );
  const { VFile } = await import(pathToFileURL(docs.resolve("vfile")).href);
  const tree = {
    type: "root",
    children: [
      {
        type: "element",
        tagName: "code",
        properties: { className: ["math-inline"] },
        children: [{ type: "text", value: "x^2 + y^2" }],
      },
    ],
  };
  const file = new VFile();
  rehypeKatex({ strict: true })(tree, file);
  assert.equal(file.messages.length, 0);
  assert.match(JSON.stringify(tree), /katex-mathml/);
  assert.match(JSON.stringify(tree), /katex-html/);
});

test("Typography preserves selectors and pseudo-elements with parser 7", () => {
  const typographyRequire = dependencyRequire(docs, "@tailwindcss/typography");
  assertPatched(typographyRequire, "postcss-selector-parser", "7.1.6");
  const plugin = docs("@tailwindcss/typography")();
  let components;
  const variants = new Map();
  plugin.handler({
    addVariant: (name, selector) => variants.set(name, selector),
    addComponents: (value) => {
      components = value;
    },
    prefix: (selector) => selector,
    theme: () => ({
      DEFAULT: {
        css: {
          "h2::before, h3::before": { color: "red" },
          p: { color: "black" },
        },
      },
    }),
  });
  assert.deepEqual(components, [
    {
      ".prose": {
        ':where(h2, h3):not(:where([class~="not-prose"],[class~="not-prose"] *))::before':
          { color: "red" },
        ':where(p):not(:where([class~="not-prose"],[class~="not-prose"] *))': {
          color: "black",
        },
      },
    },
  ]);
  assert.equal(
    variants.get("prose-h2"),
    '& :is(:where(h2):not(:where([class~="not-prose"],[class~="not-prose"] *)))',
  );
});
