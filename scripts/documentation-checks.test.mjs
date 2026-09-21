import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  validate,
  linkTargets,
  ARTIFACT_LIMIT,
} from "./check-documentation.mjs";
import { snapshot } from "./git-check-snapshot.mjs";
import { checkFormat } from "./check-staged-format.mjs";

function view(before, after, changes) {
  return {
    oldFiles: new Set(Object.keys(before)),
    files: new Set(Object.keys(after)),
    changes,
    read: (f, old = false) => {
      const s = (old ? before : after)[f];
      return s === undefined ? null : Buffer.from(s);
    },
  };
}
const f = "docs/worklog/2026-09/2026-09-19-example.md";
const index = "docs/worklog/2026-09/README.md";
const log =
  "# 기록\n\n## Summary\n설명\n## Changed\n변경\n## Notes\n검사\n## Open Questions\n없음\n## Next\n없음\n";
const added = [{ file: f, old: f, status: "A" }];
const indexed = (body) => ({
  [f]: body,
  [index]: "# 목록\n[기록](2026-09-19-example.md)",
});

test("new valid worklog and index pass", () =>
  assert.deepEqual(validate(view({}, indexed(log), added)), []));
test("new worklog requires sections and an index", () => {
  const errors = validate(view({}, { [f]: "# 기록" }, added));
  assert.ok(errors.some((e) => e.includes("missing-section:Summary")));
  assert.ok(errors.some((e) => e.includes("missing-index-link")));
});
test("unchanged legacy violations do not block editing a paragraph", () => {
  assert.deepEqual(
    validate(
      view(
        { [f]: "# Old\n[bad](missing.md)" },
        { [f]: "# Old\nchanged\n[bad](missing.md)" },
        added,
      ),
    ),
    [],
  );
});
test("new broken links in a legacy document fail", () => {
  assert.ok(
    validate(
      view({ [f]: "# Old" }, { [f]: "# Old\n[bad](missing.md)" }, added),
    ).some((e) => e.includes("broken-link:")),
  );
});
test("removing an existing required section fails", () => {
  assert.ok(
    validate(
      view(indexed(log), indexed(log.replace("## Notes", "notes")), added),
    ).some((e) => e.includes("missing-section:Notes")),
  );
});
test("deleting a target detects unchanged referring documents", () => {
  const before = {
    "docs/README.md": "# Index\n[policy](architecture/a.md)",
    "docs/architecture/a.md": "# Old",
  };
  assert.ok(
    validate(
      view(before, { "docs/README.md": before["docs/README.md"] }, [
        {
          file: "docs/architecture/a.md",
          old: "docs/architecture/a.md",
          status: "D",
        },
      ]),
    ).some((e) => e.includes("broken-link:")),
  );
});
test("fenced and inline code examples are not links or real headings", () => {
  const text =
    "# Text\n```markdown\n[bad](no.md)\n```\n`[bad](no.md)`\n[real](./ok.md#section)";
  assert.deepEqual(linkTargets("docs/a.md", text), [{ target: "docs/ok.md" }]);
});
test("links handle reference definitions, spaces, parentheses, anchors and external URLs", () => {
  assert.deepEqual(
    linkTargets(
      "docs/a.md",
      "[a](<file name.md>)\n[b](x(y).md)\n[r]: ref.md\n[z](https://example.org)\n[a](#same)",
    ),
    [
      { target: "docs/file name.md" },
      { target: "docs/x(y).md" },
      { target: "docs/ref.md" },
    ],
  );
});
test("new private absolute links fail", () => {
  assert.ok(
    validate(
      view({}, indexed(log + "\n[x](/Users/coder/file.md)"), added),
    ).some((e) => e.includes("absolute-link:")),
  );
});
test("renamed legacy worklog is not treated as a newly authored template", () => {
  const old = "docs/worklog/2026-09-19-example.md";
  assert.deepEqual(
    validate(
      view({ [old]: "# legacy" }, { [f]: "# legacy" }, [
        { file: f, old, status: "R100" },
      ]),
    ),
    [],
  );
});
test("policy metadata requires status, scope and a real review date", () => {
  const file = "docs/architecture/new.md";
  const body =
    "# 정책\n## 상태와 범위\n- 상태: 적용 중\n- 대상: docs 앱\n- 최종 검토: 2026-02-30\n## 배경\n## 결정\n## 대안과 영향\n## 관련 문서";
  const after = {
    [file]: body,
    "docs/architecture/README.md": "# 목록\n[정책](new.md)",
  };
  const changes = [{ file, old: file, status: "A" }];
  assert.ok(
    validate(view({}, after, changes)).some((e) =>
      e.includes("invalid-review-date"),
    ),
  );
  after[file] = body.replace("2026-02-30", "2026-09-19");
  assert.deepEqual(validate(view({}, after, changes)), []);
});
test("superseded ADR is an accepted architecture status", () => {
  const file = "docs/architecture/adr-0001-example.md";
  const body =
    "# ADR-0001: 이전 결정\n## 상태와 범위\n- 상태: 대체됨\n- 대상: docs 앱\n- 최종 검토: 2026-09-21\n## 배경\n## 결정\n## 대안과 영향\n## 관련 문서";
  const after = {
    [file]: body,
    "docs/architecture/README.md": "# 목록\n[이전 결정](adr-0001-example.md)",
  };
  assert.deepEqual(
    validate(view({}, after, [{ file, old: file, status: "A" }])),
    [],
  );
});
test("new large artifacts fail; untouched historical artifacts do not", () => {
  const file = "docs/verification/artifacts/big.txt",
    data = "x".repeat(ARTIFACT_LIMIT + 1);
  assert.ok(
    validate(
      view({}, { [file]: data }, [{ file, old: file, status: "A" }]),
    ).some((e) => e.includes("artifact-size:")),
  );
  assert.deepEqual(validate(view({ [file]: data }, { [file]: data }, [])), []);
});
test("malformed JSON and obvious credentials fail without printing their values", () => {
  const file = "docs/verification/artifacts/example.json";
  const secret = "a".repeat(40);
  const errors = validate(
    view({}, { [file]: "Bearer " + secret }, [
      { file, old: file, status: "A" },
    ]),
  );
  assert.ok(errors.some((e) => e.includes("invalid-json")));
  assert.ok(errors.some((e) => e.includes("literal-bearer-token")));
  assert.ok(!errors.join("\n").includes(secret));
});
test("public article examples are outside operational document validation", () => {
  const file = "docs/examples/blog-posts/post.md";
  assert.deepEqual(
    validate(
      view({}, { [file]: "article" }, [{ file, old: file, status: "A" }]),
    ),
    [],
  );
});
test("formatting reads the index and never rewrites partially staged files", async () => {
  const dir = mkdtempSync(join(tmpdir(), "docs-hooks-"));
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: dir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  try {
    git("init", "-q");
    git("config", "user.name", "Test");
    git("config", "user.email", "test@example.invalid");
    writeFileSync(join(dir, "example.json"), '{"a":1}\n');
    git("add", "example.json");
    writeFileSync(join(dir, "example.json"), '{ "a": 1 }\n');
    const initial = readFileSync(join(dir, "example.json"), "utf8");
    const staged = git("show", ":example.json");
    assert.deepEqual(await checkFormat(snapshot(["--staged"], dir), dir), [
      "example.json",
    ]);
    assert.equal(readFileSync(join(dir, "example.json"), "utf8"), initial);
    assert.equal(git("show", ":example.json"), staged);
    git("add", "example.json");
    writeFileSync(join(dir, "example.json"), '{"a":1}\n');
    assert.deepEqual(await checkFormat(snapshot(["--staged"], dir), dir), []);
    git("-c", "core.hooksPath=/dev/null", "commit", "-qm", "initial");
    const base = git("rev-parse", "HEAD").trim();
    writeFileSync(join(dir, "example.json"), '{ "a": 2 }\n');
    git("add", "example.json");
    git("-c", "core.hooksPath=/dev/null", "commit", "-qm", "second");
    assert.equal(
      snapshot(["--base", base], dir).read("example.json").toString(),
      '{ "a": 2 }\n',
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
