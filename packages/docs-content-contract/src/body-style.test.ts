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
    assert.deepEqual(getMarkdownBodyStyleIssues(body, published), {
      failures: [],
      warnings: [],
    });
  });
}

test("a shorter or different fence does not close an example", () => {
  const body =
    "## Example\n````md\n```html\n~~~\n<!-- example -->\n```\n````\n<!-- prohibited -->";
  assert.deepEqual(getMarkdownBodyStyleIssues(body).failures, [
    "line 8: HTML comments are not allowed; use frontmatter status: draft for unfinished content",
  ]);
});

for (const status of ["published", "draft"]) {
  test(`body h1 only warns for ${status} content without changing the source`, () => {
    const body = "# Original title\n## Section\n# Another title\n## Details";
    assert.deepEqual(getMarkdownBodyStyleIssues(body, { status }), {
      failures: [],
      warnings: [
        "line 1: body h1 may duplicate frontmatter title; prefer h2 or h3",
        "line 3: body h1 may duplicate frontmatter title; prefer h2 or h3",
      ],
    });
    assert.equal(
      body,
      "# Original title\n## Section\n# Another title\n## Details",
    );
  });
}

test("a standalone h1 does not fail the first-heading rule", () => {
  assert.deepEqual(getMarkdownBodyStyleIssues("# Title", published), {
    failures: [],
    warnings: [
      "line 1: body h1 may duplicate frontmatter title; prefer h2 or h3",
    ],
  });
});

test("h1 warnings do not suppress unrelated heading or comment failures", () => {
  assert.deepEqual(getMarkdownBodyStyleIssues("# Title\n#### Skip"), {
    failures: ["line 2: heading level jumps from h1 to h4"],
    warnings: [
      "line 1: body h1 may duplicate frontmatter title; prefer h2 or h3",
    ],
  });
  assert.deepEqual(getMarkdownBodyStyleIssues("#### Too deep").failures, [
    "first heading should start at h2 or h3",
  ]);
  assert.deepEqual(
    getMarkdownBodyStyleIssues("# Title\n<!-- writing -->").failures,
    [
      "line 2: HTML comments are not allowed; use frontmatter status: draft for unfinished content",
    ],
  );
});

test("reports callout and code language errors", () => {
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

test("preserves heading boundaries and whitespace semantics", () => {
  const cases: Array<[string, boolean]> = [
    ["## Topic", true],
    ["###\tTopic\u00a0", true],
    ["##\u00a0\uFEFFTopic\u2028", true],
    ["## \rTopic", true],
    ["## \u2028Topic", true],
    ["## Topic\r\t", true],
    ["##  ", true],
    ["## \r ", true],
    ["## \t", true],
    ["## ", false],
    ["## \r", false],
    ["##\r\u2028", false],
    ["## Topic\rMore", false],
    ["## Topic\u2028More", false],
    ["## Topic\u2029More", false],
    [" ## Topic", false],
    ["##Topic", false],
    ["####### Topic", false],
  ];

  for (const [body, isHeading] of cases) {
    assert.deepEqual(
      getMarkdownBodyStyleIssues(body, published),
      {
        failures: [],
        warnings: isHeading
          ? []
          : ["published content should include at least one heading"],
      },
      JSON.stringify(body),
    );
  }
});
