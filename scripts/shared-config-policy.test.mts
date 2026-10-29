import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  auditAgentInstallationPermissions,
  auditApprovalRuleset,
  matchesProtectedPath,
  parsePolicy,
  renderCodeowners,
  run,
} from "./shared-config-policy.mts";

const root = fileURLToPath(new URL("../", import.meta.url));
const policy = parsePolicy(
  JSON.parse(
    readFileSync(join(root, ".github/shared-config-policy.json"), "utf8"),
  ),
);
const template = JSON.parse(
  readFileSync(
    join(root, ".github/rulesets/shared-configuration-human-approval.json"),
    "utf8",
  ),
);

const protectedPaths = [
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "turbo.json",
  ".mise.toml",
  "mise.toml",
  ".mise.local.toml",
  "apps/docs/.mise.toml",
  "apps/docs/.npmrc",
  ".pnpmfile.cjs",
  "apps/docs/pnpm-lock.yaml",
  "package-lock.json",
  ".github/CODEOWNERS",
  ".github/shared-config-policy.json",
  ".github/rulesets/shared-configuration-human-approval.json",
  ".github/workflows/ci.yml",
  ".agents/skills/policy/SKILL.md",
  ".codex/config.toml",
  "AGENTS.md",
  "apps/docs/AGENTS.md",
  "apps/docs/CLAUDE.md",
  "apps/docs/package.json",
  "packages/ui/package.json",
  "packages/typescript-config/base.json",
  "packages/eslint-config/base.js",
  "packages/tailwind-config/shared-styles.css",
  "apps/docs/next.config.mjs",
  "apps/docs/.prettierrc.json",
  "apps/docs/tsconfig.json",
  "apps/docs/playwright.article.config.ts",
  "apps/docs-backend/Dockerfile",
  "apps/docs-backend/docker-compose.nas.yml",
  "apps/vuln-radar/railway.toml",
  "scripts/shared-config-policy.mts",
  "scripts/other.test.mts",
  "docs/process/shared-configuration-approval.md",
  "docs/runbooks/ai-github-identity-isolation.md",
  "docs/architecture/adr-0022-shared-configuration-approval.md",
];
const ordinaryPaths = [
  "apps/docs/widgets/root-landing/ui/landing-hero.tsx",
  "apps/docs/shared/message/ko.json",
  "apps/docs/public/article.webp",
  "apps/docs/content/example.mdx",
  "packages/ui/components/ui/button.tsx",
  "docs/worklog/2026-10/example.md",
  "pnpm-lock.yaml.old",
  "nested/turbo.json",
  "apps/docs/next.config.mjs.example",
];

test("generated CODEOWNERS exactly matches the explicit policy and protects itself", () => {
  assert.equal(
    readFileSync(join(root, ".github/CODEOWNERS"), "utf8"),
    renderCodeowners(policy),
  );
  assert.equal(matchesProtectedPath(".github/CODEOWNERS", policy), true);
  assert.equal(run(["--check"]), 0);
});

test("protected configuration includes root, nested, governance and guard paths", () => {
  for (const path of protectedPaths)
    assert.equal(matchesProtectedPath(path, policy), true, path);
});

test("ordinary app UI, translation, content and shared component implementation stay unowned", () => {
  // The .example path still matches next.config.* and must be reviewed.
  for (const path of ordinaryPaths.filter((path) => !path.endsWith(".example")))
    assert.equal(matchesProtectedPath(path, policy), false, path);
  assert.equal(
    matchesProtectedPath("apps/docs/next.config.mjs.example", policy),
    true,
  );
});

test("our restricted glob subset agrees with Git ignore matching used by CODEOWNERS", () => {
  const directory = mkdtempSync(join(tmpdir(), "shared-owner-match-"));
  try {
    execFileSync("git", ["init", "-q", directory]);
    writeFileSync(
      join(directory, ".gitignore"),
      policy.patterns.join("\n") + "\n",
    );
    const paths = [...protectedPaths, ...ordinaryPaths];
    const result = execFileSync(
      "git",
      ["-C", directory, "check-ignore", "--no-index", "-z", "--stdin"],
      { input: Buffer.from(paths.join("\0") + "\0") },
    )
      .toString()
      .split("\0")
      .filter(Boolean);
    const actual = new Set(result);
    for (const path of paths)
      assert.equal(matchesProtectedPath(path, policy), actual.has(path), path);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("unsafe and ambiguous patterns or owners fail closed", () => {
  for (const pattern of [
    "!package.json",
    "package.json",
    "/[ab].json",
    "/foo bar",
    "/../package.json",
    "/a\\b",
    "/a//b",
    "/",
  ])
    assert.throws(() =>
      parsePolicy({ reviewer: "@owner", patterns: [pattern] }),
    );
  for (const reviewer of ["@owner @bot", "@org/team", "@*", "owner"])
    assert.throws(() => parsePolicy({ reviewer, patterns: ["/package.json"] }));
  assert.throws(() =>
    parsePolicy({ reviewer: "@owner", patterns: ["/a", "/a"] }),
  );
  for (const path of [
    "/package.json",
    "../package.json",
    "apps//package.json",
    "apps/./package.json",
    "apps\\package.json",
    "",
  ])
    assert.throws(() => matchesProtectedPath(path, policy));
});

test("disabled rollout template is never reported as remotely enforced", () => {
  assert.deepEqual(auditApprovalRuleset(template), ["Ruleset is not active."]);
  assert.deepEqual(
    auditApprovalRuleset({ ...template, enforcement: "active" }),
    [],
  );
  assert.equal(template.bypass_actors.length, 0);
});

test("missing, stale or self-approval protections cannot pass the audit", () => {
  for (const key of [
    "dismiss_stale_reviews_on_push",
    "require_code_owner_review",
    "require_last_push_approval",
    "required_review_thread_resolution",
  ]) {
    const copy = structuredClone(template);
    copy.enforcement = "active";
    copy.rules[0].parameters[key] = false;
    assert.ok(auditApprovalRuleset(copy).some((issue) => issue.includes(key)));
  }
  const copy = structuredClone(template);
  copy.enforcement = "active";
  copy.rules[0].parameters.required_approving_review_count = 0;
  assert.ok(
    auditApprovalRuleset(copy).some((issue) => issue.includes("one approval")),
  );
});

test("bypass actors and branch exclusions fail closed; malformed rules are not silently accepted", () => {
  const copy = structuredClone(template);
  copy.enforcement = "active";
  copy.bypass_actors = [
    { actor_type: "RepositoryRole", actor_id: 5, bypass_mode: "always" },
  ];
  copy.conditions.ref_name.exclude = ["refs/heads/main"];
  assert.equal(auditApprovalRuleset(copy).length, 2);
  assert.throws(() => auditApprovalRuleset({ ...copy, rules: [] }));
  assert.throws(() => auditApprovalRuleset(null));
});

test("agent installation permissions accept minimum access and reject administration or workflow writes", () => {
  const allowed = {
    contents: "write",
    pull_requests: "write",
    metadata: "read",
    actions: "read",
    checks: "read",
  };
  assert.deepEqual(auditAgentInstallationPermissions(allowed), []);
  for (const key of [
    "administration",
    "workflows",
    "actions",
    "checks",
    "statuses",
    "secrets",
    "environments",
    "members",
  ])
    assert.ok(
      auditAgentInstallationPermissions({ ...allowed, [key]: "write" }).some(
        (issue) => issue.includes(key),
      ),
    );
  assert.ok(auditAgentInstallationPermissions({ contents: "read" }).length > 0);
});

test("the policy CLI has no activation or bypass switches", () => {
  for (const args of [
    ["--apply"],
    ["--approve"],
    ["--skip"],
    ["--check", "--apply"],
  ])
    assert.throws(() => run(args));
});

test("invalid permission values and unknown keys are not echoed", () => {
  const canary = "permission-value-canary";
  const issues = auditAgentInstallationPermissions({
    contents: canary,
    [canary]: canary,
  });
  assert.ok(issues.length > 0);
  assert.equal(issues.join(" ").includes(canary), false);
});
