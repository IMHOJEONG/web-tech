import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (file: string) =>
  readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const metadata = (file: string) => read(file).split("## 배경")[0] ?? "";

test("partial Worker supersession keeps the original ADR active with a successor link", () => {
  const previous = metadata(
    "docs/architecture/adr-0009-docs-web-push-experiment.md",
  );
  assert.match(previous, /^- 상태: 적용 중$/m);
  assert.match(
    previous,
    /^- 후속 결정\(부분 대체\): .*adr-0015-explicit-offline-article-snapshots\.md/m,
  );
  assert.match(previous, /^- 부분 대체 범위: .+구독.+발송.+유지/m);
});

test("the offline ADR explicitly links its partial predecessor and retained push responsibilities", () => {
  const next = metadata(
    "docs/architecture/adr-0015-explicit-offline-article-snapshots.md",
  );
  assert.match(
    next,
    /^- 부분 대체 대상: .*adr-0009-docs-web-push-experiment\.md/m,
  );
  assert.match(next, /^- 부분 대체 범위: .+fetch.+구독.+발송.+유지/m);
  const index = read("docs/architecture/README.md");
  assert.match(index, /ADR-0009[^\n]+ADR-0015로 부분 대체/);
});

test("agent instructions share one ADR workflow and PRs expose its review fields", () => {
  assert.match(read("AGENTS.md"), /### 매 작업의 ADR 검토/);
  assert.match(read("AGENTS.md"), /docs\/process\/adr-management\.md/);
  assert.equal(read("CLAUDE.md").trim(), "@AGENTS.md");
  const template = read(".github/pull_request_template.md");
  assert.match(template, /## ADR 검토/);
  assert.match(template, /검토한 ADR 번호\/링크/);
  assert.match(
    template,
    /판단 .*기존 결정 유지.*새 결정.*부분 대체.*해당 없음/,
  );
});
