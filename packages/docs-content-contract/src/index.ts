import { z } from "zod";

export const CONTENT_CHANNELS = ["feed", "web", "mobile", "ui-ux"] as const;
export const EDITORIAL_STATUSES = ["draft", "published", "archived"] as const;

export const LEAF_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MARKDOWN_PATH_PATTERN =
  /^(feed|web|mobile|ui-ux)\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const contentChannelSchema = z.enum(CONTENT_CHANNELS);
export const editorialStatusSchema = z.enum(EDITORIAL_STATUSES);
export const leafSlugSchema = z.string().trim().regex(LEAF_SLUG_PATTERN);
export const markdownPathSchema = z
  .string()
  .trim()
  .regex(MARKDOWN_PATH_PATTERN);
export const remoteSlugSchema = leafSlugSchema;
export const remoteMarkdownPathSchema = markdownPathSchema;

export type ContentChannel = z.infer<typeof contentChannelSchema>;
export type EditorialStatus = z.infer<typeof editorialStatusSchema>;

function normalizeBlankString(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

const trimmedStringSchema = z.preprocess(
  normalizeBlankString,
  z.string().trim().min(1),
);
const optionalScalarSchema = z
  .union([trimmedStringSchema, z.number()])
  .nullish();
const optionalStringSchema = trimmedStringSchema.nullish();
const optionalDateLikeSchema = z
  .preprocess(normalizeBlankString, z.union([z.string(), z.number()]))
  .refine(
    (value) =>
      typeof value === "number"
        ? Number.isFinite(value)
        : Number.isFinite(Date.parse(value)),
    { message: "must be a valid date-like value" },
  )
  .nullish();
const optionalReadTimeSchema = z
  .preprocess(normalizeBlankString, z.union([z.string(), z.number()]))
  .refine((value) => {
    if (typeof value === "number") {
      return Number.isFinite(value) && value > 0;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0;
  }, "must be a positive integer-like value")
  .nullish();
const optionalTagsSchema = z
  .union([z.array(trimmedStringSchema), trimmedStringSchema])
  .nullish();
const optionalStatusSchema = z
  .preprocess((value) => {
    const normalized = normalizeBlankString(value);
    return typeof normalized === "string"
      ? normalized.toLowerCase()
      : normalized;
  }, editorialStatusSchema)
  .nullish();

export const remoteRouteContractSchema = z.object({
  slug: leafSlugSchema,
  title: z.string().trim().min(1),
  markdownPath: markdownPathSchema.nullish(),
});

export const remotePostSchema = z
  .object({
    id: optionalScalarSchema,
    slug: optionalStringSchema,
    title: optionalStringSchema,
    summary: optionalStringSchema,
    date: optionalDateLikeSchema,
    updated_at: optionalDateLikeSchema,
    updatedAt: optionalDateLikeSchema,
    content: optionalStringSchema,
    body_markdown: optionalStringSchema,
    bodyMarkdown: optionalStringSchema,
    markdown: optionalStringSchema,
    body: optionalStringSchema,
    thumbnail: optionalStringSchema,
    thumbnail_url: optionalStringSchema,
    thumbnailUrl: optionalStringSchema,
    fileName: optionalStringSchema,
    path: optionalStringSchema,
    markdown_path: optionalStringSchema,
    markdownPath: optionalStringSchema,
    md_path: optionalStringSchema,
    mdPath: optionalStringSchema,
    markdown_url: optionalStringSchema,
    markdownUrl: optionalStringSchema,
    md_url: optionalStringSchema,
    mdUrl: optionalStringSchema,
    author: optionalStringSchema,
    author_name: optionalStringSchema,
    authorName: optionalStringSchema,
    author_role: optionalStringSchema,
    authorRole: optionalStringSchema,
    role: optionalStringSchema,
    read_minutes: optionalReadTimeSchema,
    readMinutes: optionalReadTimeSchema,
    reading_time: optionalReadTimeSchema,
    readingTime: optionalReadTimeSchema,
    read_time: optionalReadTimeSchema,
    readTime: optionalReadTimeSchema,
    topic: optionalStringSchema,
    topic_label: optionalStringSchema,
    topicLabel: optionalStringSchema,
    section_label: optionalStringSchema,
    sectionLabel: optionalStringSchema,
    tags: optionalTagsSchema,
    tag_list: optionalTagsSchema,
    tagList: optionalTagsSchema,
    status: optionalStatusSchema,
  })
  .passthrough();

export const remotePayloadSchema = z.union([
  z.array(remotePostSchema),
  z
    .object({
      items: z.array(remotePostSchema).optional(),
      results: z.array(remotePostSchema).optional(),
    })
    .refine(
      (value) =>
        Number(Array.isArray(value.items)) +
          Number(Array.isArray(value.results)) ===
        1,
      { message: "payload must include exactly one of items or results" },
    ),
]);

function isCanonicalDate(value: string): boolean {
  const [yearPart, monthPart, dayPart] = value.split("-");

  if (!yearPart || !monthPart || !dayPart) {
    return false;
  }

  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export const contentDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(isCanonicalDate, {
    message: "must be a valid YYYY-MM-DD date",
  });

export const publishedDocumentFrontmatterSchema = z.object({
  authorName: z.string().trim().min(1),
  authorRole: z.string().trim().min(1),
  date: contentDateSchema,
  readMinutes: z.number().int().positive(),
  slug: leafSlugSchema,
  status: z.literal("published"),
  summary: z.string().trim().min(1),
  tags: z.array(z.string().trim().min(1)).default([]),
  thumbnail: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1),
  topicLabel: z.string().trim().min(1),
  updatedAt: contentDateSchema,
});

export const canonicalPublishedPostSchema = z.object({
  authorName: z.string().trim().min(1),
  authorRole: z.string().trim().min(1),
  date: contentDateSchema,
  id: markdownPathSchema,
  markdownPath: markdownPathSchema,
  readMinutes: z.number().int().positive(),
  slug: leafSlugSchema,
  status: z.literal("published"),
  summary: z.string().trim().min(1),
  tags: z.array(z.string().trim().min(1)),
  thumbnail: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1),
  topicLabel: z.string().trim().min(1),
  updatedAt: contentDateSchema,
});

export const canonicalPostsPayloadSchema = z.object({
  results: z.array(canonicalPublishedPostSchema),
});

export type RemotePostContract = z.infer<typeof remotePostSchema>;
export type PublishedDocumentFrontmatter = z.infer<
  typeof publishedDocumentFrontmatterSchema
>;
export type CanonicalPublishedPost = z.infer<
  typeof canonicalPublishedPostSchema
>;
export type CanonicalPostsPayload = z.infer<typeof canonicalPostsPayloadSchema>;

export function validateRemoteRouteContract(input: {
  slug: string;
  title: string;
  markdownPath?: string | null;
}) {
  return remoteRouteContractSchema.safeParse(input);
}

export function parseRemotePostsPayload(payload: unknown) {
  const parseResult = remotePayloadSchema.safeParse(payload);

  if (!parseResult.success) {
    return null;
  }

  const parsedPayload = parseResult.data;

  if (Array.isArray(parsedPayload)) {
    return parsedPayload;
  }

  return parsedPayload.items ?? parsedPayload.results ?? null;
}

export function formatRemotePayloadIssues(
  issues: Array<{ path: PropertyKey[]; message: string }>,
) {
  return issues
    .map((issue) => {
      const pathLabel =
        issue.path.length > 0 ? issue.path.join(".") : "payload";
      return `${pathLabel}: ${issue.message}`;
    })
    .join("; ");
}

export function summarizeRemotePayloadShape(payload: unknown) {
  if (Array.isArray(payload)) {
    return { kind: "array", itemCount: payload.length };
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    return {
      kind: "object",
      keys: Object.keys(record).sort(),
      itemsCount: Array.isArray(record.items) ? record.items.length : null,
      resultsCount: Array.isArray(record.results)
        ? record.results.length
        : null,
    };
  }

  return { kind: typeof payload };
}
