import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import { inflateSync } from "node:zlib";
import {
  syntheticImages,
  syntheticPng,
  writeSyntheticImages,
} from "./synthetic-docs-media.mts";
import {
  assertProtectedContentEnvironment,
  assertTrustedContentRun,
  assertPrivateSearch,
  assertPrivateBuild,
  assertPrivateIntegration,
  parsePrivateRelease,
  PRIVATE_CONTENT_ENVIRONMENT,
} from "./private-content-ci-policy.mts";
import {
  prepareCiDocsContent,
  preserveCiDirectory,
  syntheticDocuments,
  writeSyntheticCorpus,
} from "./prepare-ci-docs-content.mts";

const require = createRequire(
  new URL("../apps/docs-backend/package.json", import.meta.url),
);
const { parse } = require("yaml");
const root = new URL("../", import.meta.url);
const workflow = (name: string) =>
  parse(fs.readFileSync(new URL(`.github/workflows/${name}`, root), "utf8"));
const sha = "a".repeat(40);
const env = {
  GITHUB_EVENT_NAME: "workflow_dispatch",
  GITHUB_REF: "refs/heads/main",
  GITHUB_REF_TYPE: "branch",
  GITHUB_SHA: sha,
  GITHUB_REPOSITORY: "IMHOJEONG/web-tech",
};
const event = {
  inputs: { approved_sha: sha },
  repository: { full_name: env.GITHUB_REPOSITORY },
};

const release = {
  version: 1,
  repository: "https://github.com/example/content.git",
  revision: sha,
  routes: ["/docs/web/example"],
};
test("release contract and integration fail closed without the separate content migration", () => {
  assert.deepEqual(parsePrivateRelease(release), release);
  for (const value of [
    null,
    {},
    { ...release, revision: "main" },
    { ...release, routes: [] },
    { ...release, routes: ["/docs/../private"] },
    { ...release, routes: ["/docs/web/example", "/docs/web/example"] },
    { ...release, extra: true },
    { ...release, repository: "https://example.test/content.git" },
  ])
    assert.throws(() => parsePrivateRelease(value));
  const files: Record<string, string> = {
    "apps/docs/package.json": JSON.stringify({
      scripts: { build: "node ./scripts/build.ts" },
    }),
    "apps/docs/content-release.lock.json": JSON.stringify(release),
    "apps/docs/scripts/build.ts": "synthetic build entry",
    "apps/docs/scripts/prepare-private-content.ts":
      "synthetic integration entry",
  };
  assert.deepEqual(
    assertPrivateIntegration((file) => files[file]!),
    release,
  );
  assert.throws(() =>
    assertPrivateIntegration((file) =>
      file === "apps/docs/package.json"
        ? JSON.stringify({ scripts: { build: "next build" } })
        : files[file]!,
    ),
  );
  for (const missing of Object.keys(files))
    assert.throws(() =>
      assertPrivateIntegration((file) => {
        if (file === missing) throw Error("missing integration input");
        return files[file]!;
      }),
    );
});

test("approved content rejects PRs, tags, alternate refs/repos and mismatched or mutable SHAs", () => {
  assertTrustedContentRun(env, event);
  for (const patch of [
    { GITHUB_EVENT_NAME: "pull_request" },
    { GITHUB_EVENT_NAME: "pull_request_target" },
    { GITHUB_REF: "refs/heads/feature/docs" },
    { GITHUB_REF: "refs/tags/main", GITHUB_REF_TYPE: "tag" },
    { GITHUB_REPOSITORY: "other/repo" },
    { GITHUB_SHA: "main" },
  ])
    assert.throws(() => assertTrustedContentRun({ ...env, ...patch }, event));
  for (const value of ["main", "b".repeat(40), "", `${sha}\n`])
    assert.throws(() =>
      assertTrustedContentRun(env, {
        ...event,
        inputs: { approved_sha: value },
      }),
    );
});

test("private runtime search rejects missing, duplicate, foreign and stale release routes", () => {
  const routes = ["/docs/web/one", "/docs/web/two"];
  assertPrivateSearch(
    { count: 2, results: routes.map((href) => ({ href })) },
    routes,
  );
  for (const value of [
    null,
    {},
    { count: 0, results: [] },
    { count: 2, results: [{ href: routes[0] }, { href: routes[0] }] },
    { count: 2, results: [{ href: routes[0] }, { href: "/docs/web/stale" }] },
  ])
    assert.throws(() => assertPrivateSearch(value, routes));
});

test("private runtime rejects a stale build, synthetic/legacy mode and serialized credentials", () => {
  const env = {
    DOCS_CONTENT_SOURCE: "private-git",
    DOCS_PRIVATE_CONTENT_REVISION: sha,
  };
  assertPrivateBuild(env, sha);
  for (const patch of [
    { DOCS_CONTENT_SOURCE: "legacy" },
    { DOCS_PRIVATE_CONTENT_REVISION: "b".repeat(40) },
    { DOCS_PRIVATE_CONTENT_SSH_KEY: "synthetic-rejected-input" },
  ])
    assert.throws(() => assertPrivateBuild({ ...env, ...patch }, sha));
});

const protection = {
  name: PRIVATE_CONTENT_ENVIRONMENT,
  can_admins_bypass: false,
  protection_rules: [
    {
      type: "required_reviewers",
      reviewers: [{ type: "User", reviewer: { id: 1 } }],
      prevent_self_review: true,
    },
  ],
  deployment_branch_policy: {
    protected_branches: false,
    custom_branch_policies: true,
  },
};
const policies = { branch_policies: [{ name: "main", type: "branch" }] };
test("environment must have non-self approval, no admin bypass and exactly the main branch", () => {
  assertProtectedContentEnvironment(protection, policies);
  for (const patch of [
    { name: "Preview" },
    { can_admins_bypass: true },
    { protection_rules: [] },
    {
      protection_rules: [
        { ...protection.protection_rules[0], prevent_self_review: false },
      ],
    },
    {
      protection_rules: [{ ...protection.protection_rules[0], reviewers: [] }],
    },
    { deployment_branch_policy: null },
  ])
    assert.throws(() =>
      assertProtectedContentEnvironment({ ...protection, ...patch }, policies),
    );
  for (const branch_policies of [
    [],
    [{ name: "*", type: "branch" }],
    [{ name: "main", type: "tag" }],
    [...policies.branch_policies, { name: "feature/*", type: "branch" }],
  ])
    assert.throws(() =>
      assertProtectedContentEnvironment(protection, { branch_policies }),
    );
});

test("general CI has no private key/environment and prepares the same synthetic input in every code job", () => {
  const ci = workflow("ci.yml");
  assert.equal(ci.env.DOCS_CI_SYNTHETIC, "1");
  assert.equal(ci.env.DOCS_CONTENT_SOURCE, "legacy");
  assert.doesNotMatch(
    JSON.stringify(ci),
    /secrets\.|pull_request_target|workflow_run/,
  );
  for (const [name, job] of Object.entries(ci.jobs) as [string, any][]) {
    assert.equal(job.environment, undefined, name);
    if (name === "test") continue;
    const prepare = job.steps.findIndex(
      (s: any) => s.run === "node scripts/prepare-ci-docs-content.mts",
    );
    const install = job.steps.findIndex((s: any) =>
      s.run?.startsWith("pnpm install"),
    );
    assert.ok(prepare >= 0 && prepare < install, name);
  }
});

test("credential workflow is manual main only, pinned and separates policy approval from secrets", () => {
  const wf = workflow("docs-private-content.yml");
  assert.deepEqual(Object.keys(wf.on), ["workflow_dispatch"]);
  assert.equal(wf.jobs.authorize.environment, undefined);
  assert.doesNotMatch(JSON.stringify(wf.jobs.authorize), /secrets\./);
  const job = wf.jobs.content;
  assert.equal(job.needs, "authorize");
  assert.equal(job.environment, PRIVATE_CONTENT_ENVIRONMENT);
  assert.match(job.if, /needs.authorize.result == 'success'/);
  for (const j of Object.values(wf.jobs) as any[]) {
    assert.match(j.if, /github.ref == 'refs\/heads\/main'/);
    const checkout = j.steps.find((s: any) =>
      s.uses?.startsWith("actions/checkout@"),
    );
    assert.equal(checkout.with.ref, "${{ github.sha }}");
    assert.equal(checkout.with["persist-credentials"], false);
    assert.equal(
      j.steps.find((s: any) => s.uses?.startsWith("actions/setup-node@"))?.with[
        "package-manager-cache"
      ],
      false,
    );
    assert.doesNotMatch(
      JSON.stringify(j),
      /upload-artifact|download-artifact|cache:|secrets: inherit|id-token|--prod|vercel|ssh-key:/,
    );
  }
  const steps = job.steps.filter((s: any) =>
    JSON.stringify(s).includes("secrets."),
  );
  assert.equal(steps.length, 1);
  assert.equal(steps[0].run, "node scripts/verify-private-content-ci.mts");
  assert.equal(
    steps[0].env.DOCS_PRIVATE_CONTENT_SSH_KEY,
    "${{ secrets.DOCS_PRIVATE_CONTENT_SSH_KEY }}",
  );
});

test("local preparation refuses existing source roots without hosted CI authorization", (t) => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "synthetic-ci-denied-"),
  );
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.mkdirSync(path.join(directory, "apps/docs/data"), { recursive: true });
  fs.writeFileSync(
    path.join(directory, "apps/docs/data/original.md"),
    "retain exact bytes",
  );
  assert.throws(() => prepareCiDocsContent({}, directory));
  assert.throws(() => writeSyntheticCorpus(path.join(directory, "apps/docs")));
  assert.equal(
    fs.readFileSync(path.join(directory, "apps/docs/data/original.md"), "utf8"),
    "retain exact bytes",
  );
});

test("hosted ephemeral preparation replaces discovered inputs but preserves original bytes outside checkout", (t) => {
  const directory = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), "synthetic-ci-allowed-")),
  );
  const temporary = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), "synthetic-ci-backup-")),
  );
  t.after(() => {
    fs.rmSync(directory, { recursive: true, force: true });
    fs.rmSync(temporary, { recursive: true, force: true });
  });
  fs.mkdirSync(path.join(directory, "apps/docs/data"), { recursive: true });
  fs.writeFileSync(
    path.join(directory, "apps/docs/data/original.md"),
    "retain exact bytes",
  );
  const authorized = {
    GITHUB_ACTIONS: "true",
    RUNNER_ENVIRONMENT: "github-hosted",
    DOCS_CI_SYNTHETIC: "1",
    DOCS_CONTENT_SOURCE: "legacy",
    GITHUB_WORKSPACE: directory,
    RUNNER_TEMP: temporary,
  };
  assert.throws(() =>
    prepareCiDocsContent(
      {
        ...authorized,
        DOCS_PRIVATE_CONTENT_SSH_KEY: "synthetic-rejected-input",
      },
      directory,
    ),
  );
  assert.throws(() =>
    prepareCiDocsContent({ ...authorized, RUNNER_TEMP: directory }, directory),
  );
  assert.equal(
    prepareCiDocsContent(authorized, directory),
    syntheticDocuments.length,
  );
  assert.equal(
    fs.existsSync(path.join(directory, "apps/docs/data/original.md")),
    false,
  );
  const backup = fs.readdirSync(temporary)[0]!;
  assert.equal(
    fs.readFileSync(path.join(temporary, backup, "data/original.md"), "utf8"),
    "retain exact bytes",
  );
  assert.equal(syntheticDocuments.length, 17);
  for (const [file] of syntheticDocuments)
    assert.match(
      fs.readFileSync(path.join(directory, "apps/docs", file), "utf8"),
      /Synthetic|synthetic/,
    );
});

test("synthetic cards generate their own non-default thumbnail without article assets", (t) => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "ci-image-contract-"),
  );
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  writeSyntheticCorpus(directory);
  const thumbnail = "/diagrams/http-response-stages.png";
  assert.ok(fs.statSync(path.join(directory, "public", thumbnail)).size > 0);
  assert.equal(thumbnail.startsWith("/default/"), false);
  for (const [file] of syntheticDocuments) {
    const content = fs.readFileSync(path.join(directory, file), "utf8");
    assert.match(
      content,
      /^thumbnail: \/diagrams\/http-response-stages\.png$/m,
    );
  }
});

test("synthetic PNGs decode at the unchanged responsive image dimensions", (t) => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "ci-synthetic-media-"),
  );
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  writeSyntheticImages(directory);
  for (const image of syntheticImages) {
    const bytes = fs.readFileSync(
      path.join(directory, "public", image.pathname),
    );
    assert.deepEqual(
      [...bytes.subarray(0, 8)],
      [137, 80, 78, 71, 13, 10, 26, 10],
    );
    assert.equal(bytes.readUInt32BE(16), image.width);
    assert.equal(bytes.readUInt32BE(20), image.height);
    const compressed: Buffer[] = [];
    for (let offset = 8; offset < bytes.length; ) {
      const length = bytes.readUInt32BE(offset);
      if (bytes.toString("ascii", offset + 4, offset + 8) === "IDAT")
        compressed.push(bytes.subarray(offset + 8, offset + 8 + length));
      offset += 12 + length;
    }
    assert.equal(
      inflateSync(Buffer.concat(compressed)).length,
      image.height * (image.width * 3 + 1),
    );
  }
  assert.throws(() => syntheticPng(0, 1));
  assert.throws(() => syntheticPng(1, 1601));
});

test("local synthetic media refuses real files and linked parent directories before any writes", (t) => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "ci-media-preserve-"),
  );
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.mkdirSync(path.join(directory, "public/diagrams"), { recursive: true });
  const target = path.join(directory, "public", syntheticImages[0]!.pathname);
  fs.writeFileSync(target, "retain application media");
  assert.throws(() => writeSyntheticImages(directory));
  assert.equal(fs.readFileSync(target, "utf8"), "retain application media");
  assert.equal(fs.readdirSync(path.dirname(target)).length, 1);
  const other = path.join(directory, "other");
  fs.mkdirSync(other);
  const app = path.join(directory, "linked");
  fs.mkdirSync(path.join(app, "public"), { recursive: true });
  fs.symlinkSync(other, path.join(app, "public/diagrams"));
  assert.throws(() => writeSyntheticImages(app));
  assert.deepEqual(fs.readdirSync(other), []);
});

test("hosted CI preserves application image bytes before substituting generated media", (t) => {
  const directory = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), "ci-media-backup-")),
  );
  const temporary = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), "ci-media-private-")),
  );
  t.after(() => {
    fs.rmSync(directory, { recursive: true, force: true });
    fs.rmSync(temporary, { recursive: true, force: true });
  });
  const app = path.join(directory, "apps/docs");
  const image = syntheticImages[0]!.pathname;
  const target = path.join(app, "public", image);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, "preserve original image bytes");
  prepareCiDocsContent(
    {
      GITHUB_ACTIONS: "true",
      RUNNER_ENVIRONMENT: "github-hosted",
      DOCS_CI_SYNTHETIC: "1",
      DOCS_CONTENT_SOURCE: "legacy",
      GITHUB_WORKSPACE: directory,
      RUNNER_TEMP: temporary,
    },
    directory,
  );
  const backup = fs.readdirSync(temporary)[0]!;
  assert.equal(
    fs.readFileSync(path.join(temporary, backup, "public", image), "utf8"),
    "preserve original image bytes",
  );
  assert.deepEqual(
    [...fs.readFileSync(target).subarray(0, 8)],
    [137, 80, 78, 71, 13, 10, 26, 10],
  );
});

test("synthetic dates retain the held remote article in real related-link ranking", async (t) => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "ci-prefetch-contract-"),
  );
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  writeSyntheticCorpus(directory);
  const moduleURL = new URL(
    "../apps/docs/lib/article-related-documents.ts",
    import.meta.url,
  ).href;
  const { buildArticleRelatedDocuments } = await import(moduleURL);
  const docs = syntheticDocuments.map(([file, title, slug, tags]) => {
    const source = fs.readFileSync(path.join(directory, file), "utf8");
    return {
      fileName: file,
      title,
      slug,
      tags: tags.split(","),
      topicLabel: tags.split(",")[0],
      date: source.match(/^date: (.+)$/m)![1],
    };
  });
  const publication = {
    markdownPath: "web/article-e2e-publication",
    title: "Synthetic publication",
    date: "2099-01-01",
  };
  const remote = {
    markdownPath: "web/article-e2e-remote",
    title: "Synthetic held remote",
    date: "2026-09-18",
  };
  const taxonomy = {
    markdownPath: "web/taxonomy-fixture",
    title: "Synthetic taxonomy",
    date: "2099-01-02",
  };
  const hasRemote = (values: typeof docs) =>
    buildArticleRelatedDocuments(
      [taxonomy, publication, remote, ...values],
      publication,
    ).some(
      (value: { href: string }) =>
        value.href === "/docs/web/article-e2e-remote",
    );
  assert.equal(hasRemote(docs), true);
  assert.equal(
    hasRemote(docs.map((doc) => ({ ...doc, date: "2026-11-17" }))),
    false,
  );
});

test("cross-mount backup preserves bytes and symlinks before removing hosted originals", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ci-cross-mount-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const source = path.join(root, "source");
  const destination = path.join(root, "backup");
  fs.mkdirSync(source);
  fs.writeFileSync(
    path.join(source, "article.md"),
    "synthetic preserved bytes",
  );
  fs.symlinkSync("article.md", path.join(source, "relative-link"));
  preserveCiDirectory(source, destination, {
    ...fs,
    renameSync() {
      throw Object.assign(new Error("synthetic mount boundary"), {
        code: "EXDEV",
      });
    },
  });
  assert.equal(fs.existsSync(source), false);
  assert.equal(
    fs.readFileSync(path.join(destination, "article.md"), "utf8"),
    "synthetic preserved bytes",
  );
  assert.equal(
    fs.readlinkSync(path.join(destination, "relative-link")),
    "article.md",
  );
});

test("failed or mismatched cross-mount copies retain original input and unrelated errors do not fallback", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ci-copy-failure-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const mode of ["copy-failed", "mismatch", "permission"]) {
    const source = path.join(root, mode);
    fs.mkdirSync(source);
    fs.writeFileSync(path.join(source, "article.md"), "retain synthetic bytes");
    let copies = 0;
    let removals = 0;
    assert.throws(() =>
      preserveCiDirectory(source, source + "-backup", {
        ...fs,
        renameSync() {
          throw Object.assign(new Error("synthetic denied"), {
            code: mode === "permission" ? "EACCES" : "EXDEV",
          });
        },
        cpSync(from, to, options) {
          copies++;
          if (mode === "copy-failed") throw new Error("synthetic failed copy");
          fs.cpSync(from, to, options);
          fs.writeFileSync(
            path.join(String(to), "article.md"),
            "mismatched synthetic bytes",
          );
        },
        rmSync() {
          removals++;
        },
      }),
    );
    assert.equal(copies, mode === "permission" ? 0 : 1);
    assert.equal(removals, 0, "must not attempt to remove unverified source");
    assert.equal(
      fs.readFileSync(path.join(source, "article.md"), "utf8"),
      "retain synthetic bytes",
    );
  }
});

test("denied guard CLI has sanitized errors and never starts build commands", () => {
  const output = execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `import {spawnSync} from 'node:child_process';const r=spawnSync(process.execPath,['scripts/private-content-ci-policy.mts'],{env:{PATH:process.env.PATH},encoding:'utf8'});if(r.status!==1)process.exit(1);process.stdout.write(r.stderr);`,
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.match(output, /Private content CI denied/);
  assert.doesNotMatch(output, /Bearer|Authorization|PRIVATE KEY/);
});
