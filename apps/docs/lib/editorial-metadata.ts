import { z } from 'zod'

export const editorialStatusSchema = z.enum([
    'draft',
    'published',
    'archived',
])

export type EditorialStatus = z.infer<typeof editorialStatusSchema>

export type LocalDocFrontmatterInput = {
    id?: string | number | undefined
    title?: string | undefined
    slug?: string | undefined
    summary?: string | undefined
    date?: string | number | undefined
    thumbnail?: string | null | undefined
    updatedAt?: string | undefined
    author?: string | undefined
    authorName?: string | undefined
    authorRole?: string | undefined
    role?: string | undefined
    readMinutes?: number | string | undefined
    readTime?: number | string | undefined
    topicLabel?: string | undefined
    topic?: string | undefined
    tags?: string[] | string | undefined
    status?: string | undefined
    use?: Record<string, unknown>
}

export type NormalizedEditorialMetadata = {
    updatedAt?: string
    authorName?: string
    authorRole?: string
    readMinutes?: number
    topicLabel?: string
    tags?: string[]
    status?: EditorialStatus
}

export type NormalizedDocFrontmatter = {
    id?: string
    title?: string
    slug?: string
    summary?: string
    date?: string
    thumbnail?: string | null
} & NormalizedEditorialMetadata

function normalizeOptionalString(value?: unknown) {
    if (typeof value !== 'string') {
        return undefined
    }

    const trimmedValue = value.trim()

    return trimmedValue || undefined
}

function normalizeStringLikeValue(value?: unknown) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value)
    }

    return normalizeOptionalString(value)
}

export function normalizeReadMinutes(value?: unknown) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        return Math.round(value)
    }

    if (typeof value === 'string') {
        const parsedValue = Number.parseInt(value.trim(), 10)

        if (Number.isFinite(parsedValue) && parsedValue > 0) {
            return parsedValue
        }
    }

    return undefined
}

function normalizeTags(value?: unknown) {
    const rawTags = (() => {
        if (Array.isArray(value)) {
            return value
        }

        if (typeof value === 'string') {
            return value.split(',')
        }

        return []
    })()

    const tags = Array.from(
        new Set(
            rawTags
                .map((tag) => normalizeOptionalString(tag))
                .filter((tag): tag is string => Boolean(tag))
        )
    )

    return tags.length > 0 ? tags : undefined
}

function normalizeStatus(value?: unknown) {
    const normalizedValue = normalizeOptionalString(value)?.toLowerCase()

    if (!normalizedValue) {
        return undefined
    }

    const parseResult = editorialStatusSchema.safeParse(normalizedValue)

    return parseResult.success ? parseResult.data : undefined
}

export function normalizeLocalDocFrontmatter(
    input: LocalDocFrontmatterInput
): NormalizedDocFrontmatter {
    return {
        id: normalizeStringLikeValue(input.id),
        title: normalizeOptionalString(input.title),
        slug: normalizeOptionalString(input.slug),
        summary: normalizeOptionalString(input.summary),
        date: normalizeStringLikeValue(input.date),
        thumbnail: normalizeOptionalString(input.thumbnail) ?? null,
        updatedAt: normalizeOptionalString(input.updatedAt),
        authorName: normalizeOptionalString(input.authorName ?? input.author),
        authorRole: normalizeOptionalString(input.authorRole ?? input.role),
        readMinutes: normalizeReadMinutes(input.readMinutes ?? input.readTime),
        topicLabel: normalizeOptionalString(input.topicLabel ?? input.topic),
        tags: normalizeTags(input.tags),
        status: normalizeStatus(input.status),
    }
}

export function normalizeRemoteEditorialMetadata(input: {
    updatedAt?: unknown
    updated_at?: unknown
    author?: unknown
    author_name?: unknown
    authorName?: unknown
    author_role?: unknown
    authorRole?: unknown
    role?: unknown
    read_minutes?: unknown
    readMinutes?: unknown
    reading_time?: unknown
    readingTime?: unknown
    read_time?: unknown
    readTime?: unknown
    topic?: unknown
    topic_label?: unknown
    topicLabel?: unknown
    section_label?: unknown
    sectionLabel?: unknown
    tags?: unknown
    tag_list?: unknown
    tagList?: unknown
    status?: unknown
}): NormalizedEditorialMetadata {
    return {
        updatedAt: normalizeOptionalString(input.updatedAt ?? input.updated_at),
        authorName: normalizeOptionalString(
            input.authorName ?? input.author_name ?? input.author
        ),
        authorRole: normalizeOptionalString(
            input.authorRole ?? input.author_role ?? input.role
        ),
        readMinutes: normalizeReadMinutes(
            input.readMinutes ??
                input.read_minutes ??
                input.readTime ??
                input.read_time ??
                input.readingTime ??
                input.reading_time
        ),
        topicLabel: normalizeOptionalString(
            input.topicLabel ??
                input.topic_label ??
                input.sectionLabel ??
                input.section_label ??
                input.topic
        ),
        tags: normalizeTags(input.tags ?? input.tagList ?? input.tag_list),
        status: normalizeStatus(input.status),
    }
}
