export interface BodyStyleMetadata {
  status?: unknown;
  slug?: unknown;
}

export interface BodyStyleIssues {
  failures: string[];
  warnings: string[];
}

const HEADING_PATTERN = /^(#{1,6})\s+(.+?)\s*$/;
const CALLOUT_MARKER_PATTERN = /\[!([A-Za-z][A-Za-z0-9_-]*)\]/;
const CALLOUT_BLOCKQUOTE_PATTERN = /^\s*>\s*\[!([A-Za-z][A-Za-z0-9_-]*)\]/;
const SUPPORTED_CALLOUT_MARKERS = new Set(["NOTE", "TIP", "WARNING"]);
const PLACEHOLDER_PATTERN = /\b(TODO|FIXME|lorem ipsum)\b|임시|테스트용/i;
const PLACEHOLDER_SLUGS = new Set(["test", "sample", "todo", "draft"]);

export function getMarkdownBodyStyleIssues(
  body: string,
  frontmatter: BodyStyleMetadata = {},
): BodyStyleIssues {
  const failures: string[] = [];
  const warnings: string[] = [];
  const lines = body.split(/\r?\n/);
  const status =
    typeof frontmatter.status === "string"
      ? frontmatter.status.trim().toLowerCase()
      : undefined;
  const isPublished = status === "published";
  const trimmedBody = body.trim();
  const headings: Array<{ level: number; line: number }> = [];
  let fence: { marker: string; length: number } | null = null;
  let htmlCommentStartLine: number | null = null;

  if (!trimmedBody) {
    if (isPublished) {
      warnings.push("published content should include body content");
    }

    return { failures, warnings };
  }

  for (const [index, line] of lines.entries()) {
    if (fence) {
      const closing = line.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/);
      if (
        closing &&
        closing[1]![0] === fence.marker &&
        closing[1]!.length >= fence.length
      ) {
        fence = null;
      }
      continue;
    }

    // A code fence inside an unfinished comment is not a new example.
    const opening =
      htmlCommentStartLine === null
        ? line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/)
        : null;
    if (opening && !(opening[1]![0] === "`" && opening[2]!.includes("`"))) {
      if (!opening[2]!.trim()) {
        failures.push(`line ${index + 1}: code block language is required`);
      }
      fence = { marker: opening[1]![0]!, length: opening[1]!.length };
      continue;
    }

    const htmlCommentStartIndex = line.indexOf("<!--");
    const htmlCommentEndIndex = line.indexOf("-->");

    if (htmlCommentStartLine !== null) {
      if (htmlCommentEndIndex !== -1) {
        failures.push(
          `line ${htmlCommentStartLine}: HTML comments are not allowed; use frontmatter status: draft for unfinished content`,
        );
        htmlCommentStartLine = null;
      }

      continue;
    }

    if (htmlCommentStartIndex !== -1) {
      if (htmlCommentEndIndex > htmlCommentStartIndex) {
        failures.push(
          `line ${index + 1}: HTML comments are not allowed; use frontmatter status: draft for unfinished content`,
        );
      } else {
        htmlCommentStartLine = index + 1;
      }

      continue;
    }

    if (htmlCommentEndIndex !== -1) {
      failures.push(
        `line ${index + 1}: HTML comment closing marker has no matching opener`,
      );
      continue;
    }

    const calloutMarkerMatch = line.match(CALLOUT_MARKER_PATTERN);
    const calloutBlockquoteMatch = line.match(CALLOUT_BLOCKQUOTE_PATTERN);

    if (calloutMarkerMatch) {
      const marker = calloutMarkerMatch[1]!.toUpperCase();

      if (!calloutBlockquoteMatch) {
        failures.push(
          `line ${index + 1}: callout marker should be the first text in a blockquote`,
        );
      } else if (!SUPPORTED_CALLOUT_MARKERS.has(marker)) {
        failures.push(
          `line ${index + 1}: unsupported callout marker [!${marker}]`,
        );
      }
    }

    const headingMatch = line.match(HEADING_PATTERN);

    if (!headingMatch) {
      continue;
    }

    const level = headingMatch[1]!.length;

    headings.push({ level, line: index + 1 });

    if (level === 1) {
      failures.push(`line ${index + 1}: h1 is reserved for frontmatter title`);
    }
  }

  if (fence) {
    failures.push("code block is not closed");
  }

  if (htmlCommentStartLine !== null) {
    failures.push(
      `line ${htmlCommentStartLine}: HTML comment is not closed with -->; use frontmatter status: draft for unfinished content`,
    );
  }

  if (headings.length === 0) {
    if (isPublished) {
      warnings.push("published content should include at least one heading");
    }
  } else if (headings[0]!.level !== 2 && headings[0]!.level !== 3) {
    failures.push("first heading should start at h2 or h3");
  }

  for (let index = 1; index < headings.length; index += 1) {
    const previousHeading = headings[index - 1]!;
    const currentHeading = headings[index]!;

    if (currentHeading.level - previousHeading.level > 1) {
      failures.push(
        `line ${currentHeading.line}: heading level jumps from h${previousHeading.level} to h${currentHeading.level}`,
      );
    }
  }

  if (isPublished && PLACEHOLDER_PATTERN.test(body)) {
    warnings.push("published content contains placeholder-like text");
  }

  if (
    isPublished &&
    PLACEHOLDER_SLUGS.has(String(frontmatter.slug ?? "").trim())
  ) {
    warnings.push("published content uses a placeholder-like slug");
  }

  return { failures, warnings };
}
