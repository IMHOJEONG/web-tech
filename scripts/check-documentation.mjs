import path from "node:path";
import { snapshot, isMain } from "./git-check-snapshot.mjs";

const p = path.posix;
export const ARTIFACT_LIMIT = 1024 * 1024;
const included = (file) =>
  file.startsWith("docs/") && !file.startsWith("docs/examples/");
const markdown = (file) => included(file) && file.endsWith(".md");
export function prose(text) {
  let fence = null;
  return text
    .split("\n")
    .map((line) => {
      const m = line.match(/^\s{0,3}(`{3,}|~{3,})/);
      if (m) {
        if (!fence) fence = m[1];
        else if (m[1][0] === fence[0] && m[1].length >= fence.length)
          fence = null;
        return "";
      }
      return fence ? "" : line.replace(/(`+)[\s\S]*?\1/g, "");
    })
    .join("\n");
}

export function linkTargets(file, text) {
  const source = prose(text);
  const urls = [
    ...source.matchAll(
      /\]\(\s*(<[^>]+>|(?:\\.|[^\s()]+|\([^()]*\))+)(?:\s+["'][^\n]*?["'])?\s*\)/g,
    ),
  ].map((m) => m[1]);
  urls.push(
    ...[...source.matchAll(/^\s{0,3}\[[^\]]+\]:\s*(<[^>]+>|\S+)/gm)].map(
      (m) => m[1],
    ),
  );
  return urls
    .map((raw) => {
      let value = raw.replace(/^<|>$/g, "").replace(/\\([() ])/g, "$1");
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value)) return null;
      value = value.split(/[?#]/)[0];
      try {
        value = decodeURIComponent(value);
      } catch {
        return { error: `invalid-url:${raw}` };
      }
      if (!value) return null;
      if (value.startsWith("/")) return { error: `absolute-link:${value}` };
      return { target: p.normalize(p.join(p.dirname(file), value)) };
    })
    .filter(Boolean);
}

const sections = {
  architecture: ["상태와 범위", "배경", "결정", "대안과 영향", "관련 문서"],
  runbooks: [
    "목적과 준비 조건",
    "실행 순서",
    "기대 결과",
    "실패 대응과 복구",
    "관련 검증",
  ],
  verification: [
    "대상과 조건",
    "재현 방법",
    "결과와 증거",
    "한계와 후속 작업",
    "관련 문서",
  ],
  worklog: ["Summary", "Changed", "Notes", "Open Questions", "Next"],
};
function exists(files, target) {
  return (
    files.has(target) ||
    [...files].some((f) => f.startsWith(target.replace(/\/$/, "") + "/"))
  );
}
function issues(file, buffer, files) {
  const found = new Set();
  if (!buffer || !included(file)) return found;
  const text = buffer.toString("utf8");
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text))
    found.add("private-key");
  if (/Bearer\s+[A-Za-z0-9+/_=-]{32,}/i.test(text))
    found.add("literal-bearer-token");
  if (
    file.startsWith("docs/verification/artifacts/") &&
    !file.endsWith("/README.md")
  ) {
    if (buffer.length > ARTIFACT_LIMIT)
      found.add(`artifact-size:${buffer.length}`);
    if (file.endsWith(".json"))
      try {
        JSON.parse(text);
      } catch {
        found.add("invalid-json");
      }
  }
  if (!markdown(file)) return found;
  const body = prose(text);
  if (!/^#\s+\S/m.test(body)) found.add("missing-title");
  if (!file.endsWith("/README.md")) {
    const role = file.split("/")[1];
    for (const section of sections[role] || []) {
      if (!body.split("\n").some((l) => l.trim() === `## ${section}`))
        found.add(`missing-section:${section}`);
    }
    if (role === "architecture") {
      if (!/^- 상태: (제안|적용 중|보류|폐기)\s*$/m.test(body))
        found.add("missing-status");
      if (!/^- 대상: \S.+$/m.test(body)) found.add("missing-scope");
      const date = body.match(/^- 최종 검토: (\d{4}-\d{2}-\d{2})\s*$/m)?.[1];
      if (
        !date ||
        Number.isNaN(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date
      )
        found.add("invalid-review-date");
    }
    if (role === "worklog") {
      const match = file.match(
        /^docs\/worklog\/(\d{4}-\d{2})\/(\d{4}-\d{2})-\d{2}-.+\.md$/,
      );
      if (!match || match[1] !== match[2])
        found.add("invalid-worklog-location");
    }
  }
  for (const link of linkTargets(file, text)) {
    if (link.error) found.add(link.error);
    else if (
      link.target.startsWith("../") ||
      !exists(files, link.target.replace(/:\d+(?::\d+)?$/, ""))
    )
      found.add(`broken-link:${link.target}`);
  }
  return found;
}

export function validate(view) {
  const result = [];
  const changed = new Map(view.changes.map((c) => [c.file, c]));
  const currentDocs = [...view.files].filter(markdown);
  const indexes = new Map(
    currentDocs
      .filter((f) => f.endsWith("/README.md"))
      .map((f) => [
        f,
        new Set(
          linkTargets(f, view.read(f).toString())
            .map((l) => l.target)
            .filter(Boolean),
        ),
      ]),
  );
  for (const file of view.files) {
    if (
      !included(file) ||
      (!markdown(file) && !file.startsWith("docs/verification/artifacts/"))
    )
      continue;
    const change = changed.get(file);
    const old = change?.old || file;
    const previous = issues(old, view.read(old, true), view.oldFiles);
    const current = issues(file, view.read(file), view.files);
    for (const issue of current) {
      // Scan unchanged Markdown too: deleting a target must not leave dangling links.
      if (!change && !issue.startsWith("broken-link:")) continue;
      if (!previous.has(issue)) result.push(`${file}: ${issue}`);
    }
    if (
      change &&
      !view.oldFiles.has(old) &&
      markdown(file) &&
      !file.endsWith("/README.md") &&
      file !== "docs/README.md"
    ) {
      let dir = p.dirname(file),
        linked = false;
      while (dir === "docs" || dir.startsWith("docs/")) {
        if (indexes.get(`${dir}/README.md`)?.has(file)) {
          linked = true;
          break;
        }
        if (dir === "docs") break;
        dir = p.dirname(dir);
      }
      if (!linked) result.push(`${file}: missing-index-link`);
    }
  }
  return result;
}

if (isMain(import.meta.url)) {
  try {
    const errors = validate(snapshot());
    if (errors.length) {
      console.error(errors.join("\n"));
      process.exitCode = 1;
    } else
      console.log(
        "Documentation delta checks passed (legacy issues unchanged).",
      );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
