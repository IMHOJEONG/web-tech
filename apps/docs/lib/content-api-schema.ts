import { z } from 'zod'

const LEAF_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MARKDOWN_PATH_PATTERN =
    /^(feed|web|mobile|ui-ux)\/[a-z0-9]+(?:-[a-z0-9]+)*$/

function normalizeBlankString(value: unknown) {
    if (typeof value !== 'string') {
        return value
    }

    const trimmed = value.trim()

    return trimmed ? trimmed : undefined
}

const remoteTrimmedStringSchema = z.preprocess(
    normalizeBlankString,
    z.string().trim().min(1)
)
const remoteScalarSchema = z.union([remoteTrimmedStringSchema, z.number()])
const remoteOptionalScalarSchema = remoteScalarSchema.nullish()
const remoteOptionalStringSchema = remoteTrimmedStringSchema.nullish()
const remoteOptionalDateLikeSchema = z
    .preprocess(normalizeBlankString, z.union([z.string(), z.number()]))
    .refine(
        (value) =>
            typeof value === 'number'
                ? Number.isFinite(value)
                : Number.isFinite(Date.parse(value)),
        {
            message: 'must be a valid date-like value',
        }
    )
    .nullish()
const remoteOptionalReadTimeSchema = z
    .preprocess(normalizeBlankString, z.union([z.string(), z.number()]))
    .refine((value) => {
        if (typeof value === 'number') {
            return Number.isFinite(value) && value > 0
        }

        const parsed = Number.parseInt(value, 10)
        return Number.isFinite(parsed) && parsed > 0
    }, 'must be a positive integer-like value')
    .nullish()
const remoteOptionalTagsSchema = z
    .union([z.array(remoteTrimmedStringSchema), remoteTrimmedStringSchema])
    .nullish()
const remoteOptionalStatusSchema = z
    .preprocess(
        (value) => {
            const normalized = normalizeBlankString(value)

            return typeof normalized === 'string'
                ? normalized.toLowerCase()
                : normalized
        },
        z.enum(['draft', 'published', 'archived'])
    )
    .nullish()

export const remoteSlugSchema = z.string().trim().regex(LEAF_SLUG_PATTERN)

export const remoteMarkdownPathSchema = z
    .string()
    .trim()
    .regex(MARKDOWN_PATH_PATTERN)

export const remoteRouteContractSchema = z.object({
    slug: remoteSlugSchema,
    title: z.string().trim().min(1),
    markdownPath: remoteMarkdownPathSchema.nullish(),
})

export const remotePostSchema = z
    .object({
        id: remoteOptionalScalarSchema,
        slug: remoteOptionalStringSchema,
        title: remoteOptionalStringSchema,
        summary: remoteOptionalStringSchema,
        date: remoteOptionalDateLikeSchema,
        updated_at: remoteOptionalDateLikeSchema,
        updatedAt: remoteOptionalDateLikeSchema,
        content: remoteOptionalStringSchema,
        body_markdown: remoteOptionalStringSchema,
        bodyMarkdown: remoteOptionalStringSchema,
        markdown: remoteOptionalStringSchema,
        body: remoteOptionalStringSchema,
        thumbnail: remoteOptionalStringSchema,
        thumbnail_url: remoteOptionalStringSchema,
        thumbnailUrl: remoteOptionalStringSchema,
        fileName: remoteOptionalStringSchema,
        path: remoteOptionalStringSchema,
        markdown_path: remoteOptionalStringSchema,
        markdownPath: remoteOptionalStringSchema,
        md_path: remoteOptionalStringSchema,
        mdPath: remoteOptionalStringSchema,
        markdown_url: remoteOptionalStringSchema,
        markdownUrl: remoteOptionalStringSchema,
        md_url: remoteOptionalStringSchema,
        mdUrl: remoteOptionalStringSchema,
        author: remoteOptionalStringSchema,
        author_name: remoteOptionalStringSchema,
        authorName: remoteOptionalStringSchema,
        author_role: remoteOptionalStringSchema,
        authorRole: remoteOptionalStringSchema,
        role: remoteOptionalStringSchema,
        read_minutes: remoteOptionalReadTimeSchema,
        readMinutes: remoteOptionalReadTimeSchema,
        reading_time: remoteOptionalReadTimeSchema,
        readingTime: remoteOptionalReadTimeSchema,
        read_time: remoteOptionalReadTimeSchema,
        readTime: remoteOptionalReadTimeSchema,
        topic: remoteOptionalStringSchema,
        topic_label: remoteOptionalStringSchema,
        topicLabel: remoteOptionalStringSchema,
        section_label: remoteOptionalStringSchema,
        sectionLabel: remoteOptionalStringSchema,
        tags: remoteOptionalTagsSchema,
        tag_list: remoteOptionalTagsSchema,
        tagList: remoteOptionalTagsSchema,
        status: remoteOptionalStatusSchema,
    })
    .passthrough()

export const remotePayloadSchema = z.union([
    z.array(remotePostSchema),
    z
        .object({
            items: z.array(remotePostSchema).optional(),
            results: z.array(remotePostSchema).optional(),
        })
        .refine(
            (value) =>
                Array.isArray(value.items) || Array.isArray(value.results),
            {
                message: 'payload must include items or results array',
            }
        ),
])

export function validateRemoteRouteContract(input: {
    slug: string
    title: string
    markdownPath?: string | null
}) {
    return remoteRouteContractSchema.safeParse(input)
}

export function parseRemotePostsPayload(payload: unknown) {
    const parseResult = remotePayloadSchema.safeParse(payload)

    if (!parseResult.success) {
        return null
    }

    const parsedPayload = parseResult.data

    if (Array.isArray(parsedPayload)) {
        return parsedPayload
    }

    if (Array.isArray(parsedPayload.items)) {
        return parsedPayload.items
    }

    if (Array.isArray(parsedPayload.results)) {
        return parsedPayload.results
    }

    return null
}

export function formatRemotePayloadIssues(
    issues: Array<{ path: PropertyKey[]; message: string }>
) {
    return issues
        .map((issue) => {
            const pathLabel =
                issue.path.length > 0 ? issue.path.join('.') : 'payload'
            return `${pathLabel}: ${issue.message}`
        })
        .join('; ')
}

export function summarizeRemotePayloadShape(payload: unknown) {
    if (Array.isArray(payload)) {
        return {
            kind: 'array',
            itemCount: payload.length,
        }
    }

    if (payload && typeof payload === 'object') {
        const record = payload as Record<string, unknown>

        return {
            kind: 'object',
            keys: Object.keys(record).sort(),
            itemsCount: Array.isArray(record.items)
                ? record.items.length
                : null,
            resultsCount: Array.isArray(record.results)
                ? record.results.length
                : null,
        }
    }

    return {
        kind: typeof payload,
    }
}
