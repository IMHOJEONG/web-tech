import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test, type TestContext } from "node:test";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const cli = join(packageRoot, "node_modules/@turbo/gen/dist/cli.js");
const templatePath = join(
  packageRoot,
  "turbo/generators/templates/component.tsx",
);

function createFixture(t: TestContext) {
  const root = mkdtempSync(join(tmpdir(), "web-tech-ui-generator-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const ui = join(root, "packages/ui");
  mkdirSync(ui, { recursive: true });
  const manifest = JSON.parse(
    readFileSync(join(repositoryRoot, "package.json"), "utf8"),
  ) as { packageManager: string };
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({
      name: "ui-generator-fixture",
      private: true,
      packageManager: manifest.packageManager,
    }),
  );
  cpSync(
    join(repositoryRoot, "pnpm-workspace.yaml"),
    join(root, "pnpm-workspace.yaml"),
  );
  cpSync(
    join(repositoryRoot, ".prettierrc.json"),
    join(root, ".prettierrc.json"),
  );
  writeFileSync(join(root, "turbo.json"), JSON.stringify({ tasks: {} }));
  for (const file of [
    "package.json",
    "tsconfig.json",
    "tsconfig.build.json",
    "tsconfig.scripts.json",
    "turbo/generators",
    "scripts/build.mts",
    "src/styles/package.css",
  ]) {
    mkdirSync(dirname(join(ui, file)), { recursive: true });
    cpSync(join(packageRoot, file), join(ui, file), { recursive: true });
  }
  symlinkSync(
    join(packageRoot, "node_modules"),
    join(ui, "node_modules"),
    "dir",
  );
  for (const name of ["typescript-config", "tailwind-config"]) {
    symlinkSync(
      join(repositoryRoot, "packages", name),
      join(root, "packages", name),
      "dir",
    );
  }
  return { root, ui };
}

function generate(root: string, ui: string, name: string) {
  const result = spawnSync(
    process.execPath,
    [cli, "run", "react-component", "--root", root, "--args", name],
    {
      cwd: ui,
      encoding: "utf8",
      timeout: 20_000,
      env: { ...process.env, CI: "true", DO_NOT_TRACK: "1" },
    },
  );
  assert.ifError(result.error);
  return result;
}

test("the generator template is valid TSX with canonical Prettier formatting", async () => {
  const template = readFileSync(templatePath, "utf8");
  assert.equal(
    await prettier.check(template, {
      ...(await prettier.resolveConfig(templatePath)),
      filepath: templatePath,
    }),
    true,
  );
  assert.equal(template.includes("{{"), false);
  assert.equal(template.match(/GeneratedComponent/g)?.length, 2);
});

test("real Turbo generation participates in formatting, build, exports, types and SSR without changing the manifest", async (t) => {
  const { root, ui } = createFixture(t);
  const manifestBefore = readFileSync(join(ui, "package.json"), "utf8");
  const names = [
    ["user-card", "user-card", "UserCard"],
    ["status_panel", "status-panel", "StatusPanel"],
    ["Article Summary", "article-summary", "ArticleSummary"],
    [
      "Very Long Reusable Article Summary Component",
      "very-long-reusable-article-summary-component",
      "VeryLongReusableArticleSummaryComponent",
    ],
  ] as const;
  for (const [input, file, identifier] of names) {
    const result = generate(root, ui, input);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const generated = readFileSync(
      join(ui, "components/ui", `${file}.tsx`),
      "utf8",
    );
    assert.ok(generated.includes(`export const ${identifier}`));
    assert.equal(generated.includes("GeneratedComponent"), false);
    const filepath = join(ui, "components/ui", `${file}.tsx`);
    assert.equal(
      await prettier.check(generated, {
        ...(await prettier.resolveConfig(filepath)),
        filepath,
      }),
      true,
    );
  }
  assert.equal(readFileSync(join(ui, "package.json"), "utf8"), manifestBefore);
  assert.equal(existsSync(join(ui, "src/user-card.tsx")), false);
  execFileSync(process.execPath, [join(ui, "scripts/build.mts")], {
    cwd: ui,
    encoding: "utf8",
    timeout: 30_000,
  });
  const require = createRequire(join(ui, "package.json"));
  const react = require("react") as typeof import("react");
  const server =
    require("react-dom/server") as typeof import("react-dom/server");
  for (const [, file, identifier] of names) {
    assert.ok(existsSync(join(ui, "dist/components/ui", `${file}.d.ts`)));
    const exports = require(`@web-tech/ui/components/${file}`) as Record<
      string,
      import("react").ComponentType<{ children: import("react").ReactNode }>
    >;
    const component = exports[identifier];
    assert.equal(typeof component, "function");
    assert.equal(
      server.renderToStaticMarkup(
        react.createElement(component!, null, "hello"),
      ),
      `<div><h1>${identifier} Component</h1>hello</div>`,
    );
  }
  writeFileSync(
    join(ui, "consumer.tsx"),
    'import { UserCard } from "@web-tech/ui/components/user-card";\nexport const example = <UserCard>Typed child</UserCard>;\n',
  );
  execFileSync(
    process.execPath,
    [
      join(ui, "node_modules/typescript/bin/tsc"),
      "--noEmit",
      "-p",
      "tsconfig.json",
    ],
    { cwd: ui, encoding: "utf8", timeout: 30_000 },
  );
  execFileSync(
    process.execPath,
    [
      join(ui, "node_modules/typescript/bin/tsc"),
      "-p",
      "tsconfig.scripts.json",
    ],
    { cwd: ui, encoding: "utf8", timeout: 30_000 },
  );
});

test("the public turbo gen command discovers the UI workspace without a config override", (t) => {
  const { root, ui } = createFixture(t);
  execFileSync(
    process.execPath,
    [
      join(repositoryRoot, "node_modules/turbo/bin/turbo"),
      "gen",
      "react-component",
      "--root",
      root,
      "--no-update-notifier",
      "--args",
      "Notice Card",
    ],
    {
      cwd: ui,
      encoding: "utf8",
      timeout: 30_000,
      env: { ...process.env, CI: "true", DO_NOT_TRACK: "1" },
    },
  );
  assert.ok(existsSync(join(ui, "components/ui/notice-card.tsx")));
});

test("CLI bypass rejects invalid names before creating files or editing exports", (t) => {
  const { root, ui } = createFixture(t);
  const manifestBefore = readFileSync(join(ui, "package.json"), "utf8");
  for (const input of ["../escape", "123-button", "bad/name", "", "<script>"]) {
    const result = generate(root, ui, input);
    assert.notEqual(result.status, 0, `Unexpected CLI success: ${input}`);
    assert.equal(existsSync(join(ui, "components")), false);
    assert.equal(
      readFileSync(join(ui, "package.json"), "utf8"),
      manifestBefore,
    );
  }
  assert.equal(existsSync(join(root, "escape.tsx")), false);
});

test("an existing component is never overwritten and no package export is appended", (t) => {
  const { root, ui } = createFixture(t);
  const file = join(ui, "components/ui/user-card.tsx");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, "// preserved user component\n");
  const manifestBefore = readFileSync(join(ui, "package.json"), "utf8");
  const result = generate(root, ui, "user-card");
  assert.notEqual(result.status, 0);
  assert.equal(readFileSync(file, "utf8"), "// preserved user component\n");
  assert.equal(readFileSync(join(ui, "package.json"), "utf8"), manifestBefore);
  assert.deepEqual(readdirSync(dirname(file)), ["user-card.tsx"]);
});
