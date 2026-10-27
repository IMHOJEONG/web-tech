import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { checkServerIdentity, type PeerCertificate } from "node:tls";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, brotliDecompressSync } from "node:zlib";
import {
  assertNodeRuntime,
  NODE_SECURITY_FLOOR,
} from "./check-node-runtime.mts";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (file: string) => readFileSync(join(root, file), "utf8");
const yaml = createRequire(join(root, "apps/docs-backend/package.json"))(
  "yaml",
);
const pin = read(".node-version").trim();

type Step = {
  name?: string;
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
};
type Workflow = {
  on?: Record<string, { paths?: string[]; branches?: string[] }>;
  jobs: Record<string, { steps: Step[] }>;
};

function assertNodeSetup(steps: Step[]) {
  let count = 0;
  for (const [index, step] of steps.entries()) {
    if (!step.uses?.startsWith("actions/setup-node@")) continue;
    count += 1;
    assert.equal(step.with?.["node-version-file"], ".node-version");
    assert.equal(step.with?.["node-version"], undefined);
    assert.equal(steps[index + 1]?.run, "node scripts/check-node-runtime.mts");
  }
  return count;
}

function assertDockerStages(source: string) {
  const stages = source.split(/^FROM /m).slice(1);
  const nodeStages = stages.filter((stage) => stage.startsWith("node:"));
  assert.equal(nodeStages.length, 2, "verify both builder/base and runtime");
  return nodeStages.map((stage) => {
    const image = stage.split(/\s/)[0] ?? "";
    const match = /^node:([\d.]+)-bookworm-slim@sha256:([a-f0-9]{64})$/.exec(
      image,
    );
    assert.ok(match, "pin an official patch tag and immutable index digest");
    const version = match[1];
    assert.ok(version);
    assertNodeRuntime(version);
    assert.equal(version, pin);
    assert.match(
      stage,
      /COPY scripts\/check-node-runtime\.mts \/opt\/check-node-runtime\.mts/,
    );
    assert.match(stage, /RUN node \/opt\/check-node-runtime\.mts/);
    return image;
  });
}

test("runtime gate rejects vulnerable, unsupported, prerelease and malformed versions", () => {
  for (const version of [
    "24.12.0",
    "24.21.0",
    "24.22.0",
    "22.23.4",
    "25.0.0",
    "26.12.1",
    "24.22.1-rc.0",
    "24.22.1+build",
    "24.022.1",
    "24.22",
    "invalid",
    "24.999999999999999999999.1",
  ]) {
    assert.throws(() => assertNodeRuntime(version), /unsupported/);
  }
  for (const version of ["24.22.1", "v24.22.1", "24.22.2", "24.23.0"]) {
    assert.doesNotThrow(() => assertNodeRuntime(version));
  }
});

test("the running process and exact mise/CI pins satisfy the security floor", () => {
  assertNodeRuntime(process.version);
  assertNodeRuntime(pin);
  assert.equal(NODE_SECURITY_FLOOR, "24.22.1");
  assert.match(
    read(".mise.toml"),
    new RegExp(`^node = "${pin.replaceAll(".", "\\.")}"$`, "m"),
  );
});

test("CLI checks the actual process without a version override", () => {
  const result = spawnSync(
    process.execPath,
    [join(root, "scripts/check-node-runtime.mts")],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /security floor 24\.22\.1 verified/);
});

test("every CI Node setup reads the pin and gates before dependency execution", () => {
  let count = 0;
  for (const file of [
    ".github/workflows/ci.yml",
    ".github/workflows/documentation.yml",
    ".github/workflows/docs-backend-image.yml",
  ]) {
    const workflow = yaml.parse(read(file)) as Workflow;
    for (const job of Object.values(workflow.jobs)) {
      count += assertNodeSetup(job.steps);
      const install = job.steps.findIndex((step) =>
        step.run?.startsWith("pnpm install"),
      );
      if (install !== -1) {
        const gate = job.steps.findIndex(
          (step) => step.run === "node scripts/check-node-runtime.mts",
        );
        assert.ok(gate >= 0 && gate < install);
      }
    }
  }
  assert.equal(count, 9);
});

test("workflow guard rejects a major-only selection or missing gate", () => {
  const setup = {
    uses: "actions/setup-node@pinned",
    with: { "node-version-file": ".node-version" },
  };
  assert.throws(() =>
    assertNodeSetup([{ ...setup, with: { "node-version": 24 } }]),
  );
  assert.throws(() => assertNodeSetup([setup, { run: "pnpm install" }]));
});

test("both container stages share the reviewed patch and digest", () => {
  const images = [
    "apps/docs-backend/Dockerfile",
    "apps/vuln-radar-backend/Dockerfile",
  ].flatMap((file) => assertDockerStages(read(file)));
  assert.equal(new Set(images).size, 1);
});

test("container guard rejects an old base or an unguarded runtime stage", () => {
  const source = read("apps/docs-backend/Dockerfile");
  assert.throws(() => assertDockerStages(source.replaceAll(pin, "24.21.0")));
  const runtime = source.lastIndexOf("RUN node /opt/check-node-runtime.mts");
  assert.throws(() =>
    assertDockerStages(
      source.slice(0, runtime) +
        source
          .slice(runtime)
          .replace("RUN node /opt/check-node-runtime.mts", ""),
    ),
  );
});

test("image publication pulls the pinned base and observes policy inputs", () => {
  const workflow = yaml.parse(
    read(".github/workflows/docs-backend-image.yml"),
  ) as Workflow;
  const job = workflow.jobs.build;
  assert.ok(job);
  const steps = job.steps;
  const build = steps.find((step) =>
    step.uses?.startsWith("docker/build-push-action@"),
  );
  assert.equal(build?.with?.pull, true);
  assert.equal(build?.with?.platforms, "linux/amd64");
  assert.equal(build?.with?.push, "${{ github.event_name != 'pull_request' }}");
  assert.deepEqual(workflow.on?.push?.branches, ["main"]);
  for (const event of ["push", "pull_request"]) {
    for (const file of [
      ".node-version",
      ".mise.toml",
      "scripts/check-node-runtime.mts",
    ]) {
      assert.ok(
        workflow.on?.[event]?.paths?.includes(file),
        `${event}: ${file}`,
      );
    }
  }
});

for (const denied of [false, true]) {
  test(`local hook wrapper prefers mise and ${denied ? "stops on failed" : "passes the"} runtime gate`, (t) => {
    const directory = mkdtempSync(join(tmpdir(), "node-hook-gate-"));
    t.after(() => rmSync(directory, { recursive: true, force: true }));
    const calls = join(directory, "calls");
    writeFileSync(
      join(directory, "mise"),
      `#!/bin/sh\nprintf '%s\\n' "$*" >> "$CALLS"\ncase "$*" in\n  'exec -- node '*) exit ${denied ? 7 : 0} ;;\n  'exec -- pnpm '*) printf 'managed-pnpm\\n' ;;\n  *) exit 99 ;;\nesac\n`,
      { mode: 0o755 },
    );
    writeFileSync(join(directory, "pnpm"), "#!/bin/sh\nexit 98\n", {
      mode: 0o755,
    });
    const result = spawnSync(
      "/bin/sh",
      [join(root, "scripts/pnpmw.sh"), "--version"],
      {
        cwd: root,
        env: { PATH: `${directory}:/usr/bin:/bin`, CALLS: calls },
        encoding: "utf8",
      },
    );
    assert.equal(result.status, denied ? 7 : 0, result.stderr);
    const records = readFileSync(calls, "utf8").trim().split("\n");
    assert.match(records[0] ?? "", /exec -- node .*check-node-runtime\.mts$/);
    assert.equal(records.length, denied ? 1 : 2);
    if (!denied) assert.equal(records[1], "exec -- pnpm --version");
    assert.doesNotMatch(read("scripts/pnpmw.sh"), /24\.12\.0/);
  });
}

test("patched runtime retains valid Brotli decoding", () => {
  const body = Buffer.from(
    JSON.stringify({ label: "정상 압축 회귀", values: [1, 2, 3] }),
  );
  assert.deepEqual(brotliDecompressSync(brotliCompressSync(body)), body);
});

test("TLS accepts normal identities but rejects DNS SANs for noncanonical IP endpoints", () => {
  // Metadata-only fixtures test hostname matching, not certificate-chain validation.
  const certificate = (subjectaltname: string): PeerCertificate => ({
    subjectaltname,
    subject: {},
    issuer: {},
    ca: false,
    raw: Buffer.alloc(0),
    valid_from: "",
    valid_to: "",
    serialNumber: "",
    fingerprint: "",
    fingerprint256: "",
    fingerprint512: "",
  });
  assert.equal(
    checkServerIdentity("example.test", certificate("DNS:example.test")),
    undefined,
  );
  assert.equal(
    checkServerIdentity("127.0.0.1", certificate("IP Address:127.0.0.1")),
    undefined,
  );
  for (const host of [
    "0177.0.0.1",
    "0127.0.0.1",
    "0x7f.0.0.1",
    "2130706433",
    "127.1",
    "１２７.0.0.1",
  ]) {
    assert.ok(
      checkServerIdentity(
        host,
        certificate("DNS:127.0.0.1, DNS:87.0.0.1, DNS:*.0.0.1"),
      ),
      host,
    );
  }
});
