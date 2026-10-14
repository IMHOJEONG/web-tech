import assert from "node:assert/strict";
import test from "node:test";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as prettier from "prettier";
import { ESLint } from "eslint";
import baseConfig from "../packages/eslint-config/base.js";
import nextConfig from "../packages/eslint-config/next.js";
import reactConfig from "../packages/eslint-config/react-internal.js";
import { checkFormat } from "./check-staged-format.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const readJson = (file) =>
  JSON.parse(readFileSync(path.join(root, file), "utf8"));
const sources = {
  "example.ts": 'const value={nested:[1,2],label:"test"};\n',
  "example.tsx": 'export const View=()=> <div title="hello">Hello</div>;\n',
  "example.mjs": "export const value={one:1};\n",
  "example.mts": "export const value: number=1;\n",
  "example.json": '{"value":1}\n',
  "example.css": ".box{color:red;}\n",
  "example.yaml": "items: [one,two]\n",
  "example.md": "# Title\n\n-   item\n",
  "example.mdx": "export const value={one:1}\n\n<Value value={value}/>\n",
};

function fixture(t) {
  const cwd = mkdtempSync(path.join(tmpdir(), "tooling-format-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  return cwd;
}

function view(sources) {
  return {
    changes: Object.keys(sources).map((file) => ({ file, status: "A" })),
    read: (file) => Buffer.from(sources[file]),
  };
}

test("root formatting options preserve Prettier's existing default output", async () => {
  const config = readJson(".prettierrc.json");
  assert.equal(config.printWidth, 80);
  assert.equal(config.tabWidth, 2);
  for (const [file, source] of Object.entries(sources)) {
    assert.equal(
      await prettier.format(source, { ...config, filepath: file }),
      await prettier.format(source, { filepath: file }),
      file,
    );
  }
});

test("repository ignores generated outputs and keeps authored formatting targets", async () => {
  const ignorePath = [
    path.join(root, ".gitignore"),
    path.join(root, ".prettierignore"),
  ];
  for (const file of [
    "apps/vuln-radar-backend/generated/prisma/client.ts",
    "apps/docs/.next/example.js",
    "apps/docs/.cache/eslint/cache.json",
    "apps/docs/test-results/result.json",
    "apps/docs/playwright-report/index.html",
    "apps/docs/routeTree.gen.ts",
    "pnpm-lock.yaml",
  ]) {
    assert.equal(
      (await prettier.getFileInfo(path.join(root, file), { ignorePath }))
        .ignored,
      true,
      file,
    );
  }
  for (const file of [
    "apps/docs/lib/search-query.ts",
    "apps/docs/app/css/mdx.css",
    "apps/docs/category/web/example.mdx",
    ".github/workflows/documentation.yml",
    "package.json",
  ]) {
    const info = await prettier.getFileInfo(path.join(root, file), {
      ignorePath,
    });
    assert.equal(info.ignored, false, file);
    assert.ok(info.inferredParser, file);
  }
});

test("nested docs and backend formatting styles remain independent", async () => {
  assert.deepEqual(
    await prettier.resolveConfig(
      path.join(root, "apps/docs/lib/search-query.ts"),
    ),
    { trailingComma: "es5", tabWidth: 4, semi: false, singleQuote: true },
  );
  for (const app of ["docs-backend", "vuln-radar-backend"]) {
    assert.deepEqual(
      await prettier.resolveConfig(path.join(root, `apps/${app}/src/main.ts`)),
      { singleQuote: true, trailingComma: "all" },
    );
  }
  assert.deepEqual(
    await prettier.resolveConfig(
      path.join(root, "packages/ui/components/ui/button.tsx"),
    ),
    readJson(".prettierrc.json"),
  );
});

test("changed-content formatting checks every supported source type without writing", async (t) => {
  const cwd = fixture(t);
  const staged = {};
  for (const [file, source] of Object.entries(sources)) {
    const formatted = await prettier.format(source, { filepath: file });
    assert.notEqual(source, formatted, file);
    staged[file] = source;
    writeFileSync(path.join(cwd, file), formatted);
  }
  assert.deepEqual(await checkFormat(view(staged), cwd), Object.keys(sources));
  for (const file of Object.keys(sources)) {
    const formatted = readFileSync(path.join(cwd, file), "utf8");
    assert.equal(
      formatted,
      await prettier.format(sources[file], { filepath: file }),
    );
    staged[file] = formatted;
    writeFileSync(path.join(cwd, file), sources[file]);
  }
  assert.deepEqual(await checkFormat(view(staged), cwd), []);
  for (const file of Object.keys(sources)) {
    assert.equal(readFileSync(path.join(cwd, file), "utf8"), sources[file]);
  }
});

test("changed-content formatting resolves ignore files from the supplied repository", async (t) => {
  const cwd = fixture(t);
  writeFileSync(path.join(cwd, ".gitignore"), "ignored-by-git/\n");
  writeFileSync(path.join(cwd, ".prettierignore"), "ignored-by-prettier/\n");
  const staged = { "visible.json": '{"value":1}\n' };
  for (const directory of ["ignored-by-git", "ignored-by-prettier"]) {
    mkdirSync(path.join(cwd, directory));
    staged[`${directory}/example.json`] = '{"value":1}\n';
  }
  staged["image.bin"] = "not a supported formatting language";
  assert.deepEqual(await checkFormat(view(staged), cwd), ["visible.json"]);
  assert.deepEqual(
    await checkFormat(
      {
        changes: [{ file: "deleted.json", status: "D" }],
        read() {
          throw new Error("deleted files must not be read");
        },
      },
      cwd,
    ),
    [],
  );
});

test("changed-content formatting uses the nearest config for staged source", async (t) => {
  const cwd = fixture(t);
  mkdirSync(path.join(cwd, "app"));
  writeFileSync(
    path.join(cwd, ".prettierrc.json"),
    JSON.stringify({ semi: true }),
  );
  writeFileSync(
    path.join(cwd, "app/.prettierrc.json"),
    JSON.stringify({ semi: false, singleQuote: true }),
  );
  const staged = {
    "root.ts": 'const title = "test";\n',
    "app/example.ts": "const title = 'test'\n",
  };
  assert.deepEqual(await checkFormat(view(staged), cwd), []);
  staged["app/example.ts"] = staged["root.ts"];
  assert.deepEqual(await checkFormat(view(staged), cwd), ["app/example.ts"]);
});

test("Next and React extensions include base JS/TS recommended config only once", () => {
  const recommended = baseConfig.filter(
    (entry) =>
      entry.rules?.["for-direction"] ||
      entry.name?.startsWith("typescript-eslint/"),
  );
  assert.equal(recommended.length, 4);
  for (const config of [nextConfig, reactConfig]) {
    for (const entry of recommended) {
      assert.equal(config.filter((candidate) => candidate === entry).length, 1);
    }
    assert.equal(config.at(-1).name, "config-prettier");
    assert.equal(
      config.find((entry) => entry.rules?.["react-hooks/rules-of-hooks"])
        ?.rules["react-hooks/rules-of-hooks"],
      "error",
    );
  }
  assert.equal(
    baseConfig.find((entry) => entry.rules?.["turbo/no-undeclared-env-vars"])
      ?.rules["turbo/no-undeclared-env-vars"],
    "warn",
  );
  assert.ok(
    nextConfig.some((entry) => entry.rules?.["@next/next/no-img-element"]),
  );
});

test("workspace lint uses isolated content caches and retains the warning gate", () => {
  for (const file of [
    "apps/docs/package.json",
    "apps/docs-backend/package.json",
    "apps/vuln-radar/package.json",
    "apps/vuln-radar-backend/package.json",
    "packages/ui/package.json",
    "packages/api/package.json",
    "packages/docs-content-contract/package.json",
  ]) {
    const script = readJson(file).scripts.lint;
    assert.match(script, /--max-warnings 0/);
    assert.match(
      script,
      /--cache --cache-strategy content --cache-location \.cache\/eslint\//,
    );
    assert.doesNotMatch(script, /--fix/);
  }
});

test("CLI format checks and CI changed-commit checks stay read-only", () => {
  const scripts = readJson("package.json").scripts;
  assert.equal(scripts.format, "prettier --write .");
  assert.equal(scripts["format:check"], "prettier --check .");
  assert.equal(
    scripts["format:changed:check"],
    "node ./scripts/check-staged-format.mjs",
  );
  assert.equal(
    scripts["format:staged:check"],
    "node ./scripts/check-staged-format.mjs --staged",
  );
  const workflow = readFileSync(
    path.join(root, ".github/workflows/documentation.yml"),
    "utf8",
  );
  assert.ok(workflow.includes('pnpm format:changed:check --base "$BASE_SHA"'));
  assert.ok(
    workflow.includes(
      "github.event.pull_request.base.sha || github.event.before",
    ),
  );
  assert.doesNotMatch(workflow, /prettier --write|pnpm format\s*$/m);
});

test("ESLint content cache detects source and rule changes without rewriting source", async (t) => {
  const cwd = fixture(t);
  const file = path.join(cwd, "example.js");
  const cacheLocation = path.join(cwd, ".cache/eslint/cache");
  const createLinter = (severity) =>
    new ESLint({
      cwd,
      overrideConfigFile: true,
      overrideConfig: [{ rules: { "no-unused-vars": severity } }],
      cache: true,
      cacheStrategy: "content",
      cacheLocation,
    });
  writeFileSync(file, "console.log(1);\n");
  const eslint = createLinter("error");
  assert.equal((await eslint.lintFiles([file]))[0].messages.length, 0);
  const cache = readFileSync(cacheLocation, "utf8");
  assert.equal((await eslint.lintFiles([file]))[0].messages.length, 0);
  assert.equal(readFileSync(cacheLocation, "utf8"), cache);
  const invalid = "const unused = 1;\n";
  writeFileSync(file, invalid);
  const result = (await eslint.lintFiles([file]))[0];
  // The shared only-warn plugin can downgrade severity; the diagnostic must still exist.
  assert.equal(result.messages.length, 1);
  assert.equal(result.messages[0].ruleId, "no-unused-vars");
  assert.equal(
    (await createLinter("off").lintFiles([file]))[0].messages.length,
    0,
  );
  assert.equal(readFileSync(file, "utf8"), invalid);
});
