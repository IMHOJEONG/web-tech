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
