import assert from "node:assert/strict";
import test from "node:test";
import { getMarkdownBodyStyleIssues } from "./body-style.ts";

const published = { status: "published", slug: "example" };

test("accepts headings and supported callouts", () => {
  assert.deepEqual(
    getMarkdownBodyStyleIssues(
      "## Topic\n### Detail\n> [!NOTE]\n> Note\n> [!TIP] Tip\n> [!WARNING] Warning",
      published,
    ),
    { failures: [], warnings: [] },
  );
});

for (const body of [
  "## Topic\n<!-- writing -->",
  "## Topic\n<!-- writing →",
  "## Topic\n<!-- multi\nline -->",
  "## Topic\n-->",
  "## Topic\n<!-- multi\n```html\n-->",
]) {
  test(`rejects comment outside examples: ${JSON.stringify(body)}`, () => {
    assert.ok(getMarkdownBodyStyleIssues(body, published).failures.length > 0);
  });
}

for (const fence of ["```", "````", "~~~", "~~~~"]) {
  test(`allows comment examples inside ${fence} fences`, () => {
    const body = `## Example\n${fence}html\n<!-- comment -->\n# code\n[!INFO]\n${fence}\n`;
    assert.deepEqual(getMarkdownBodyStyleIssues(body, published).failures, []);
  });
}

test("a shorter or different fence does not close an example", () => {
  const body =
    "## Example\n````md\n```html\n~~~\n<!-- example -->\n```\n````\n<!-- prohibited -->";
  assert.deepEqual(getMarkdownBodyStyleIssues(body).failures, [
    "line 8: HTML comments are not allowed; use frontmatter status: draft for unfinished content",
  ]);
});

test("reports heading, callout and code language errors", () => {
  assert.deepEqual(getMarkdownBodyStyleIssues("# Title\n#### Skip").failures, [
    "line 1: h1 is reserved for frontmatter title",
    "first heading should start at h2 or h3",
    "line 2: heading level jumps from h1 to h4",
  ]);
  assert.equal(getMarkdownBodyStyleIssues("> [!INFO]").failures.length, 1);
  assert.equal(getMarkdownBodyStyleIssues("[!NOTE]").failures.length, 1);
  assert.deepEqual(getMarkdownBodyStyleIssues("~~~\ncode").failures, [
    "line 1: code block language is required",
    "code block is not closed",
  ]);
});

test("warnings do not become hard failures and drafts avoid publication warnings", () => {
  assert.deepEqual(getMarkdownBodyStyleIssues("", published), {
    failures: [],
    warnings: ["published content should include body content"],
  });
  assert.deepEqual(getMarkdownBodyStyleIssues("", { status: "draft" }), {
    failures: [],
    warnings: [],
  });
  const issues = getMarkdownBodyStyleIssues("## TODO\nTemporary note", {
    status: "published",
    slug: "test",
  });
  assert.deepEqual(issues.failures, []);
  assert.equal(issues.warnings.length, 2);
});

test("body leading horizontal rules are not mistaken for frontmatter", () => {
  assert.ok(
    getMarkdownBodyStyleIssues("---\n<!-- writing -->\n---", published).failures
      .length > 0,
  );
});
