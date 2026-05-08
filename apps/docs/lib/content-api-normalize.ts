import { normalizeDocPath } from '~/lib/normalize-doc-path'
import { normalizeRemoteContent } from '~/lib/content-api-html'
import type { Metadata, RemotePost, SearchData } from '~/lib/content-api-types'

function normalizeThumbnailPath(thumbnail?: string | null) {
    if (!thumbnail) {
        return null
    }

    const value = thumbnail.trim()

    if (!value) {
        return null
    }

    if (/^https?:\/\//i.test(value)) {
        return value
    }

    const publicIndex = value.indexOf('public/')
    if (publicIndex !== -1) {
        const sliced = value.slice(publicIndex + 'public/'.length)
        return sliced.startsWith('/') ? sliced : `/${sliced}`
    }

    return value.startsWith('/') ? value : `/${value}`
}

function getInlineMarkdown(post: RemotePost) {
    return (
        post.content ??
        post.body_markdown ??
        post.bodyMarkdown ??
        post.markdown ??
        post.body ??
        ''
    )
}

export function getMarkdownReference(post: RemotePost) {
    return (
        post.markdown_url ??
        post.markdownUrl ??
        post.md_url ??
        post.mdUrl ??
        post.markdown_path ??
        post.markdownPath ??
        post.md_path ??
        post.mdPath ??
        null
    )
}

function stripFileExtension(value: string) {
    return value.replace(/\.[a-z0-9]+$/i, '')
}

function normalizeReadMinutes(value?: unknown) {
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

function getFallbackSlug(post: RemotePost) {
    const reference =
        getMarkdownReference(post) ?? post.fileName ?? post.path ?? ''
    const normalized = stripFileExtension(reference.trim())
        .split('/')
        .filter(Boolean)
        .pop()

    return normalized?.trim() || ''
}

function formatFallbackTitle(value: string) {
    const normalized = value.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()

    if (!normalized) {
        return ''
    }

    return normalized
        .split(' ')
        .map((token) =>
            token.length <= 2
                ? token.toUpperCase()
                : token.charAt(0).toUpperCase() + token.slice(1)
        )
        .join(' ')
}

export function getRemotePostSlug(post: RemotePost) {
    return (
        post.slug?.trim() ||
        String(post.id ?? '').trim() ||
        getFallbackSlug(post)
    )
}

export function getRemotePostTitle(post: RemotePost, slug: string) {
    return post.title?.trim() || formatFallbackTitle(slug)
}

export function normalizeRemoteReference(reference: string) {
    const trimmedReference = reference.trim()

    if (!trimmedReference) {
        return null
    }

    if (
        /^https?:\/\//i.test(trimmedReference) ||
        /^\/\//.test(trimmedReference) ||
        trimmedReference.includes('..') ||
        trimmedReference.includes('\\') ||
        /[\u0000-\u001f]/.test(trimmedReference)
    ) {
        return null
    }

    return trimmedReference.replace(/^\/+/, '')
}

export function getInlineContentResult(post: RemotePost) {
    const content = getInlineMarkdown(post).trim()

    if (!content) {
        return null
    }

    return normalizeRemoteContent(content, null)
}

export function normalizeRemotePostMeta(
    post: RemotePost
): Partial<Metadata> | null {
    const slug = getRemotePostSlug(post)
    const title = getRemotePostTitle(post, slug)

    if (!slug || !title) {
        return null
    }

    const summary = post.summary?.trim() ?? ''
    const date = post.date?.trim() ?? ''
    const id = String(post.id ?? slug)
    const markdownPath = getMarkdownReference(post)
    const fileName = normalizeDocPath(
        post.fileName ?? post.path ?? markdownPath ?? `remote/${slug}`
    )

    return {
        id,
        slug,
        title,
        summary,
        date,
        content: '',
        fileName,
        contentFormat: 'html',
        contentSource: 'remote',
        markdownPath,
        thumbnail: normalizeThumbnailPath(
            post.thumbnail ?? post.thumbnail_url ?? post.thumbnailUrl
        ),
        authorName: post.authorName ?? post.author_name ?? post.author,
        authorRole: post.authorRole ?? post.author_role ?? post.role,
        readMinutes: normalizeReadMinutes(
            post.readMinutes ??
                post.read_minutes ??
                post.readTime ??
                post.read_time ??
                post.readingTime ??
                post.reading_time
        ),
        topicLabel:
            post.topicLabel ??
            post.topic_label ??
            post.sectionLabel ??
            post.section_label ??
            post.topic,
    }
}

export function normalizeRemoteSearchResult(
    post: Partial<Metadata>
): SearchData | null {
    if (!post.slug) {
        return null
    }

    const content = post.content ?? ''
    const summary = post.summary || content.slice(0, 200)
    const fileName = normalizeDocPath(
        post.markdownPath ?? post.fileName ?? `remote/${post.slug}`
    )

    return {
        id: `${post.id ?? post.slug}`,
        title: post.title,
        summary,
        content,
        slug: post.slug,
        fileName,
        date: post.date,
        thumbnail: post.thumbnail ?? null,
        href: `/docs/${post.slug}`,
        section: fileName.startsWith('data/shadcn/')
            ? 'UI/UX'
            : fileName.startsWith('category/fe/')
              ? 'Web'
              : fileName.startsWith('category/be/')
                ? 'Backend'
                : fileName.startsWith('category/computer-science/')
                  ? 'Computer Science'
                  : 'Docs',
    }
}
