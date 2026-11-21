import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

export const PRIVATE_CONTENT_ENVIRONMENT = "docs-private-content";
export type ContentCiIdentity = {
  executor: { login: string; id: number };
  reviewer: { login: string; id: number };
};

function positiveId(value: unknown): number {
  assert.equal(typeof value, "string");
  assert.match(value as string, /^[1-9]\d*$/);
  const id = Number(value);
  assert.ok(Number.isSafeInteger(id));
  return id;
}

export function readContentCiIdentity(
  env: NodeJS.ProcessEnv,
): ContentCiIdentity {
  const executor = {
    login: env.DOCS_CONTENT_CI_EXECUTOR_LOGIN ?? "",
    id: positiveId(env.DOCS_CONTENT_CI_EXECUTOR_ID),
  };
  const reviewer = {
    login: env.DOCS_CONTENT_CI_REVIEWER_LOGIN ?? "",
    id: positiveId(env.DOCS_CONTENT_CI_REVIEWER_ID),
  };
  assert.match(executor.login, /^[a-zA-Z0-9][a-zA-Z0-9-]{0,99}\[bot\]$/);
  assert.match(reviewer.login, /^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}$/);
  assert.notEqual(executor.id, reviewer.id);
  assert.notEqual(executor.login.toLowerCase(), reviewer.login.toLowerCase());
  return { executor, reviewer };
}
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
export function assertPrivateSearch(value: unknown, routes: readonly string[]) {
  const data = value as { results: { href: string }[]; count: number };
  assert.ok(Array.isArray(data.results));
  assert.equal(data.count, routes.length);
  assert.deepEqual(data.results.map((r) => r.href).sort(), routes.toSorted());
}
export function assertTrustedContentRun(
  env: NodeJS.ProcessEnv,
  event: unknown,
) {
  const e = event as {
    inputs?: { approved_sha?: string };
    repository?: { full_name?: string };
    sender?: { login?: string; id?: number; type?: string };
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
  const identity = readContentCiIdentity(env);
  assert.equal(env.GITHUB_ACTOR, identity.executor.login);
  assert.equal(env.GITHUB_ACTOR_ID, String(identity.executor.id));
  assert.equal(env.GITHUB_TRIGGERING_ACTOR, identity.executor.login);
  assert.equal(
    env.GITHUB_RUN_ATTEMPT,
    "1",
    "dispatch a new run for a fresh approval",
  );
  positiveId(env.GITHUB_RUN_ID);
  assert.equal(env.GITHUB_WORKFLOW_SHA, env.GITHUB_SHA);
  assert.equal(
    env.GITHUB_WORKFLOW_REF,
    "IMHOJEONG/web-tech/.github/workflows/docs-private-content.yml@refs/heads/main",
  );
  assert.equal(e.sender?.type, "Bot");
  assert.equal(e.sender?.login, identity.executor.login);
  assert.equal(e.sender?.id, identity.executor.id);
  return identity;
}

export function assertApprovedContentRevision(
  event: unknown,
  release: ReturnType<typeof parsePrivateRelease>,
) {
  const input = event as { inputs?: { approved_content_revision?: string } };
  assert.equal(input.inputs?.approved_content_revision, release.revision);
}

export function assertProtectedContentEnvironment(
  environment: any,
  policies: any,
  identity: ContentCiIdentity,
) {
  assert.ok(Number.isSafeInteger(environment.id) && environment.id > 0);
  assert.equal(environment.name, PRIVATE_CONTENT_ENVIRONMENT);
  assert.equal(environment.can_admins_bypass, false);
  const review = environment.protection_rules?.find(
    (r: any) => r.type === "required_reviewers",
  );
  assert.ok(
    review && Array.isArray(review.reviewers) && review.reviewers.length > 0,
  );
  assert.equal(review.prevent_self_review, true);
  assert.deepEqual(
    review.reviewers.map((r: any) => ({
      type: r.type,
      userType: r.reviewer?.type,
      id: r.reviewer?.id,
      login: r.reviewer?.login,
    })),
    [{ type: "User", userType: "User", ...identity.reviewer }],
  );
  assert.deepEqual(environment.deployment_branch_policy, {
    protected_branches: false,
    custom_branch_policies: true,
  });
  assert.deepEqual(
    policies.branch_policies?.map((p: any) => ({ name: p.name, type: p.type })),
    [{ name: "main", type: "branch" }],
  );
  assert.equal(policies.total_count, 1);
}

export function assertHumanContentApproval(
  history: unknown,
  environment: { id: number; name: string },
  identity: ContentCiIdentity,
) {
  assert.ok(Array.isArray(history) && history.length <= 100);
  const targeted = history.filter((entry: any) => {
    assert.ok(entry && Array.isArray(entry.environments));
    return entry.environments.some(
      (e: any) => e.id === environment.id && e.name === environment.name,
    );
  });
  assert.equal(
    targeted.length,
    1,
    "one explicit approval for this Environment is required",
  );
  const approval = targeted[0];
  assert.equal(approval.state, "approved");
  assert.equal(approval.user?.type, "User");
  assert.equal(approval.user?.id, identity.reviewer.id);
  assert.equal(approval.user?.login, identity.reviewer.login);
  assert.notEqual(approval.user.id, identity.executor.id);
}

export async function verifyContentAuthorization(
  env: NodeJS.ProcessEnv,
  event: unknown,
  read: (path: string) => Promise<any>,
  afterApproval = false,
) {
  const identity = assertTrustedContentRun(env, event);
  assert.equal(env.DOCS_PRIVATE_CONTENT_SSH_KEY, undefined);
  const run = await read(`actions/runs/${env.GITHUB_RUN_ID}`);
  assert.equal(run.id, Number(env.GITHUB_RUN_ID));
  assert.equal(run.head_sha, env.GITHUB_SHA);
  assert.equal(run.head_branch, "main");
  assert.equal(run.event, "workflow_dispatch");
  assert.equal(run.run_attempt, 1);
  for (const actor of [run.actor, run.triggering_actor]) {
    assert.equal(actor?.type, "Bot");
    assert.equal(actor?.id, identity.executor.id);
    assert.equal(actor?.login, identity.executor.login);
  }
  const environment = await read(`environments/${PRIVATE_CONTENT_ENVIRONMENT}`);
  const policies = await read(
    `environments/${PRIVATE_CONTENT_ENVIRONMENT}/deployment-branch-policies?per_page=100`,
  );
  assertProtectedContentEnvironment(environment, policies, identity);
  if (afterApproval) {
    const history = await read(`actions/runs/${env.GITHUB_RUN_ID}/approvals`);
    assertHumanContentApproval(history, environment, identity);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const fs = await import("node:fs");
    const args = process.argv.slice(2);
    assert.ok(
      args.length === 0 ||
        (args.length === 1 && args[0] === "--after-approval"),
    );
    const event = JSON.parse(
      fs.readFileSync(process.env.GITHUB_EVENT_PATH!, "utf8"),
    );
    assertTrustedContentRun(process.env, event);
    const release = assertPrivateIntegration((file) =>
      fs.readFileSync(file, "utf8"),
    );
    assertApprovedContentRevision(event, release);
    const token = process.env.GH_TOKEN;
    assert.ok(token);
    const read = async (path: string) => {
      const response = await fetch(
        `https://api.github.com/repos/IMHOJEONG/web-tech/${path}`,
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
    await verifyContentAuthorization(
      process.env,
      event,
      read,
      args.length === 1,
    );
    console.info(
      args.length === 1
        ? "[docs.private_ci] trusted bot, code, content revision and human approval verified; no content key accessed"
        : "[docs.private_ci] trusted bot, code, content revision and environment policy verified; awaiting human approval",
    );
  } catch {
    console.error(
      "Private content CI denied: trusted main SHA and reviewed, main-only Environment are required.",
    );
    process.exitCode = 1;
  }
}
