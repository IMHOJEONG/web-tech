import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export interface OwnershipPolicy {
  reviewer: string;
  patterns: string[];
}

type ObjectValue = Record<string, unknown>;

function object(value: unknown): ObjectValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected an object.");
  }
  return value as ObjectValue;
}

export function parsePolicy(input: unknown): OwnershipPolicy {
  const policy = object(input);
  if (
    typeof policy.reviewer !== "string" ||
    !/^@[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(policy.reviewer)
  ) {
    throw new Error(
      "Expected one explicit GitHub user, not a team or wildcard.",
    );
  }
  if (!Array.isArray(policy.patterns) || !policy.patterns.length)
    throw new Error("Expected protected paths.");
  const patterns = policy.patterns.map((value: unknown) => {
    if (
      typeof value !== "string" ||
      !value.startsWith("/") ||
      value.includes("..") ||
      /[\s!#\[\]\\]/.test(value) ||
      value.includes("//") ||
      value.length < 2
    ) {
      throw new Error(
        "Only anchored, non-negated CODEOWNERS globs are supported.",
      );
    }
    return value;
  });
  if (new Set(patterns).size !== patterns.length)
    throw new Error("Duplicate protected pattern.");
  return { reviewer: policy.reviewer, patterns };
}

export function renderCodeowners(policy: OwnershipPolicy): string {
  return [
    "# Generated from .github/shared-config-policy.json.",
    "# Every matching path requires its human owner when server rules are active.",
    "# The file alone does not enforce review or isolate credentials.",
    "# Regenerate with: node --experimental-strip-types scripts/shared-config-policy.mts --render",
    ...policy.patterns.map((pattern) => `${pattern} ${policy.reviewer}`),
    "",
  ].join("\n");
}

// Restricted glob subset shared with the generated, anchored CODEOWNERS entries.
export function matchesProtectedPath(
  path: string,
  policy: OwnershipPolicy,
): boolean {
  if (
    !path ||
    path.startsWith("/") ||
    path.split("/").some((part) => !part || part === "." || part === "..") ||
    path.includes("\\")
  )
    throw new Error("Expected a repository-relative Git path.");
  return policy.patterns.some((pattern) => {
    let source = "^";
    for (let index = 1; index < pattern.length; index += 1) {
      if (pattern.slice(index, index + 3) === "**/") {
        source += "(?:[^/]+/)*";
        index += 2;
      } else if (pattern.slice(index, index + 2) === "**") {
        source += ".*";
        index += 1;
      } else if (pattern[index] === "*") source += "[^/]*";
      else if (pattern[index] === "?") source += "[^/]";
      else source += pattern[index]!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    return new RegExp(`${source}$`).test(path);
  });
}

export function auditApprovalRuleset(input: unknown): string[] {
  const ruleset = object(input);
  const issues: string[] = [];
  if (ruleset.target !== "branch") issues.push("Expected branch ruleset.");
  if (ruleset.enforcement !== "active") issues.push("Ruleset is not active.");
  if (
    !Array.isArray(ruleset.bypass_actors) ||
    ruleset.bypass_actors.length !== 0
  )
    issues.push("Bypass actors must be explicitly empty.");
  const conditions = object(ruleset.conditions);
  const refs = object(conditions.ref_name);
  if (
    !Array.isArray(refs.include) ||
    refs.include.length !== 1 ||
    refs.include[0] !== "~DEFAULT_BRANCH" ||
    !Array.isArray(refs.exclude) ||
    refs.exclude.length !== 0
  )
    issues.push("Expected the default branch without exclusions.");
  if (!Array.isArray(ruleset.rules)) throw new Error("Missing rules.");
  const approvalRules = ruleset.rules.filter(
    (rule: unknown) => object(rule).type === "pull_request",
  );
  if (approvalRules.length !== 1)
    throw new Error("Expected exactly one pull request rule.");
  const parameters = object(object(approvalRules[0]).parameters);
  for (const field of [
    "dismiss_stale_reviews_on_push",
    "require_code_owner_review",
    "require_last_push_approval",
    "required_review_thread_resolution",
  ]) {
    if (parameters[field] !== true) issues.push(`Missing ${field}.`);
  }
  if (
    !Number.isInteger(parameters.required_approving_review_count) ||
    Number(parameters.required_approving_review_count) < 1
  )
    issues.push("At least one approval is required.");
  if (
    !Array.isArray(parameters.allowed_merge_methods) ||
    parameters.allowed_merge_methods.length !== 1 ||
    parameters.allowed_merge_methods[0] !== "squash"
  )
    issues.push("Expected squash-only merges in the additional ruleset.");
  return issues;
}

export function auditAgentInstallationPermissions(input: unknown): string[] {
  const permissions = object(input);
  const allowed = new Map([
    ["contents", "write"],
    ["pull_requests", "write"],
    ["metadata", "read"],
    ["actions", "read"],
    ["checks", "read"],
    ["statuses", "read"],
  ]);
  const issues: string[] = [];
  const knownNames = new Set([
    ...allowed.keys(),
    "administration",
    "workflows",
    "secrets",
    "environments",
    "members",
  ]);
  for (const [key, value] of Object.entries(permissions)) {
    if (allowed.get(key) !== value)
      issues.push(
        `Unexpected permission: ${knownNames.has(key) ? key : "unknown"}.`,
      );
  }
  for (const key of ["contents", "pull_requests"])
    if (permissions[key] !== "write") issues.push(`Missing ${key}=write.`);
  return issues;
}

export function run(args: string[]): number {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const policy = parsePolicy(
    JSON.parse(
      readFileSync(resolve(root, ".github/shared-config-policy.json"), "utf8"),
    ),
  );
  if (args.length === 1 && args[0] === "--render") {
    process.stdout.write(renderCodeowners(policy));
    return 0;
  }
  if (
    args.length === 2 &&
    ["--audit-ruleset", "--audit-agent-permissions"].includes(args[0]!)
  ) {
    const input: unknown = JSON.parse(readFileSync(resolve(args[1]!), "utf8"));
    const issues =
      args[0] === "--audit-ruleset"
        ? auditApprovalRuleset(input)
        : auditAgentInstallationPermissions(input);
    for (const issue of issues) console.error(issue);
    if (!issues.length)
      console.log(
        "Settings passed. This does not prove credential isolation or a rejected merge.",
      );
    return issues.length ? 1 : 0;
  }
  if (args.length !== 0 && !(args.length === 1 && args[0] === "--check"))
    throw new Error(
      "Use --check, --render, --audit-ruleset FILE, or --audit-agent-permissions FILE. No mutation command exists.",
    );
  if (
    readFileSync(resolve(root, ".github/CODEOWNERS"), "utf8") !==
    renderCodeowners(policy)
  )
    throw new Error("CODEOWNERS differs from its protected-path policy.");
  console.log(
    "CODEOWNERS matches policy. Remote activation and agent identity are separate checks.",
  );
  return 0;
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  try {
    process.exitCode = run(process.argv.slice(2));
  } catch (error) {
    console.error(
      error instanceof SyntaxError
        ? "Invalid JSON input."
        : error instanceof Error
          ? error.message
          : "Policy check failed.",
    );
    process.exitCode = 1;
  }
}
