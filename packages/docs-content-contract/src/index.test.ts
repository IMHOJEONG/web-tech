import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalPostsPayloadSchema,
  markdownPathSchema,
  parseRemotePostsPayload,
} from "./index.ts";

test("accepts canonical channel and leaf-slug paths only", () => {
  assert.equal(markdownPathSchema.safeParse("web/event-loop").success, true);
  assert.equal(
    markdownPathSchema.safeParse("web/nested/event-loop").success,
    false,
  );
  assert.equal(markdownPathSchema.safeParse("../secret").success, false);
});

test("accepts archived legacy metadata without publishing it canonically", () => {
  const posts = parseRemotePostsPayload({
    results: [
      {
        slug: "old-note",
        title: "Old note",
        markdownPath: "feed/old-note",
        status: "archived",
      },
    ],
  });

  assert.equal(posts?.[0]?.status, "archived");
});

test("accepts either legacy items or canonical results payloads", () => {
  const item = {
    markdownPath: "web/event-loop",
    slug: "event-loop",
    title: "Event Loop",
  };

  assert.deepEqual(parseRemotePostsPayload({ items: [item] }), [item]);
  assert.deepEqual(parseRemotePostsPayload({ results: [item] }), [item]);
});

test("rejects ambiguous payloads containing both items and results", () => {
  assert.equal(
    parseRemotePostsPayload({
      items: [{ slug: "legacy", title: "Legacy" }],
      results: [{ slug: "canonical", title: "Canonical" }],
    }),
    null,
  );
});

test("validates the NestJS canonical list payload", () => {
  const result = canonicalPostsPayloadSchema.safeParse({
    results: [
      {
        authorName: "HoJeong Im",
        authorRole: "Web Engineer",
        date: "2026-09-09",
        id: "web/event-loop",
        markdownPath: "web/event-loop",
        readMinutes: 4,
        slug: "event-loop",
        status: "published",
        summary: "이벤트 루프 실행 순서",
        tags: ["javascript"],
        title: "Event Loop",
        topicLabel: "WEB",
        updatedAt: "2026-09-09",
      },
    ],
  });

  assert.equal(result.success, true);
});

test("rejects impossible calendar dates and incomplete published metadata", () => {
  const result = canonicalPostsPayloadSchema.safeParse({
    results: [
      {
        date: "2026-02-30",
        id: "web/event-loop",
        markdownPath: "web/event-loop",
        readMinutes: 4,
        slug: "event-loop",
        status: "published",
        summary: "이벤트 루프 실행 순서",
        tags: [],
        title: "Event Loop",
        topicLabel: "WEB",
        updatedAt: "2026-09-09",
      },
    ],
  });

  assert.equal(result.success, false);
});

test("search text is an optional, typed additive field with empty-body compatibility", () => {
  for (const searchText of [undefined, null, "", "  body-only needle  "]) {
    const posts = parseRemotePostsPayload({
      results: [{ slug: "note", title: "Note", searchText }],
    });
    assert.ok(posts);
    assert.equal(
      posts[0]?.searchText,
      typeof searchText === "string" ? searchText.trim() : searchText,
    );
  }
  assert.equal(
    parseRemotePostsPayload({
      results: [{ slug: "note", title: "Note", searchText: 42 }],
    }),
    null,
  );
});

test("canonical output preserves search text without requiring it from older producers", () => {
  const post = {
    authorName: "Writer",
    authorRole: "Engineer",
    date: "2026-10-26",
    id: "web/note",
    markdownPath: "web/note",
    readMinutes: 2,
    slug: "note",
    status: "published",
    summary: "Overview",
    tags: [],
    title: "Note",
    topicLabel: "WEB",
    updatedAt: "2026-10-26",
  };
  for (const searchText of [undefined, "", "searchable body"]) {
    const parsed = canonicalPostsPayloadSchema.parse({
      results: [{ ...post, searchText }],
    });
    assert.equal(parsed.results[0]?.searchText, searchText);
  }
});
