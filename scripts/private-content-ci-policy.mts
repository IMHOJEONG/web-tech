import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

export const PRIVATE_CONTENT_ENVIRONMENT = "docs-private-content";
export function parsePrivateRelease(value: unknown) {
  const v = value as {
    version: number;
    repository: string;
    revision: string;
    routes: string[];
  };
  assert.ok(v && typeof v === "object");
  assert.deepEqual(Object.keys(v).sort(), [
    "repository",
    "revision",
    "routes",
    "version",
  ]);
  assert.equal(v.version, 1);
  assert.equal(typeof v.repository, "string");
  assert.match(v.repository, /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\.git$/);
  assert.equal(typeof v.revision, "string");
  assert.match(v.revision, /^[a-f0-9]{40}$/);
  assert.ok(
    Array.isArray(v.routes) && v.routes.length > 0 && v.routes.length <= 1000,
  );
  assert.equal(new Set(v.routes).size, v.routes.length);
  assert.ok(
    v.routes.every(
      (route) =>
        typeof route === "string" &&
        /^\/docs\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)*[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
          route,
        ),
    ),
  );
  return v;
}

export function assertPrivateIntegration(read: (file: string) => string) {
  const pkg = JSON.parse(read("apps/docs/package.json"));
  assert.equal(
    pkg.scripts?.build,
    "node ./scripts/build.ts",
    "private content integration must be reviewed and merged separately first",
  );
  for (const name of ["build.ts", "prepare-private-content.ts"])
    assert.ok(read(`apps/docs/scripts/${name}`).trim());
  return parsePrivateRelease(
    JSON.parse(read("apps/docs/content-release.lock.json")),
  );
}
export function assertPrivateBuild(
  env: Record<string, unknown>,
  revision: string,
) {
  assert.equal(env.DOCS_CONTENT_SOURCE, "private-git");
  assert.equal(env.DOCS_PRIVATE_CONTENT_REVISION, revision);
  assert.equal(
    Object.keys(env).some((key) => /KEY|TOKEN|PASSWORD|SECRET/.test(key)),
    false,
  );
}
export function assertPrivateSearch(value: unknown, routes: string[]) {
  const data = value as { results: { href: string }[]; count: number };
  assert.ok(Array.isArray(data.results));
  assert.equal(data.count, routes.length);
  assert.deepEqual(data.results.map((r) => r.href).sort(), [...routes].sort());
}
export function assertTrustedContentRun(
  env: NodeJS.ProcessEnv,
  event: unknown,
) {
  const e = event as {
    inputs?: { approved_sha?: string };
    repository?: { full_name?: string };
  };
  assert.equal(env.GITHUB_EVENT_NAME, "workflow_dispatch");
  assert.equal(env.GITHUB_REF, "refs/heads/main");
  assert.equal(env.GITHUB_REF_TYPE, "branch");
  assert.equal(env.GITHUB_REPOSITORY, "IMHOJEONG/web-tech");
  assert.equal(e.repository?.full_name, env.GITHUB_REPOSITORY);
  assert.match(env.GITHUB_SHA ?? "", /^[a-f0-9]{40}$/);
  assert.equal(
    e.inputs?.approved_sha,
    env.GITHUB_SHA,
    "approval must bind the exact checked-out workflow/code SHA",
  );
}

export function assertProtectedContentEnvironment(
  environment: any,
  policies: any,
) {
  assert.equal(environment.name, PRIVATE_CONTENT_ENVIRONMENT);
  assert.equal(environment.can_admins_bypass, false);
  const review = environment.protection_rules?.find(
    (r: any) => r.type === "required_reviewers",
  );
  assert.ok(
    review && Array.isArray(review.reviewers) && review.reviewers.length > 0,
  );
  assert.equal(review.prevent_self_review, true);
  assert.deepEqual(environment.deployment_branch_policy, {
    protected_branches: false,
    custom_branch_policies: true,
  });
  assert.deepEqual(
    policies.branch_policies?.map((p: any) => ({ name: p.name, type: p.type })),
    [{ name: "main", type: "branch" }],
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const fs = await import("node:fs");
    assertTrustedContentRun(
      process.env,
      JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH!, "utf8")),
    );
    assertPrivateIntegration((file) => fs.readFileSync(file, "utf8"));
    const token = process.env.GH_TOKEN;
    assert.ok(token);
    const read = async (suffix: string) => {
      const response = await fetch(
        `https://api.github.com/repos/IMHOJEONG/web-tech/environments/${PRIVATE_CONTENT_ENVIRONMENT}${suffix}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
          },
          redirect: "error",
          signal: AbortSignal.timeout(15000),
        },
      );
      assert.equal(response.status, 200);
      return response.json();
    };
    assertProtectedContentEnvironment(
      await read(""),
      await read("/deployment-branch-policies?per_page=100"),
    );
    console.info(
      "[docs.private_ci] trusted SHA and environment policy verified; no content key accessed",
    );
  } catch {
    console.error(
      "Private content CI denied: trusted main SHA and reviewed, main-only Environment are required.",
    );
    process.exitCode = 1;
  }
}
