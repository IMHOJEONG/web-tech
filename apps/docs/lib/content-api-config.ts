import type { ContentApiConfig } from '~/lib/content-api-types'

function trimTrailingSlash(value: string) {
    return value.replace(/\/+$/, '')
}

export function trimLeadingSlash(value: string) {
    return value.replace(/^\/+/, '')
}

export function joinUrl(base: string, path: string) {
    return `${trimTrailingSlash(base)}/${trimLeadingSlash(path)}`
}

function createContentApiConfig(
    label: ContentApiConfig['label'],
    baseUrl?: string,
    markdownBaseUrl?: string,
    assetBaseUrl?: string
): ContentApiConfig | null {
    const normalizedBaseUrl = baseUrl?.trim()

    if (!normalizedBaseUrl) {
        return null
    }

    const normalizedMarkdownBaseUrl = markdownBaseUrl?.trim()
    const normalizedAssetBaseUrl = assetBaseUrl?.trim()

    return {
        label,
        baseUrl: normalizedBaseUrl,
        postsPath:
            process.env.BLOG_CONTENT_API_POSTS_PATH?.trim() || '/api/posts',
        markdownBaseUrl:
            normalizedMarkdownBaseUrl || normalizedBaseUrl || undefined,
        assetBaseUrl: normalizedAssetBaseUrl || undefined,
    }
}

export function getContentApiConfig() {
    return (
        createContentApiConfig(
            'public',
            process.env.BLOG_CONTENT_API_BASE_URL_PUBLIC,
            process.env.BLOG_CONTENT_MARKDOWN_BASE_URL_PUBLIC,
            process.env.BLOG_CONTENT_ASSET_BASE_URL_PUBLIC
        ) ??
        createContentApiConfig(
            'internal',
            process.env.BLOG_CONTENT_API_BASE_URL_INTERNAL,
            process.env.BLOG_CONTENT_MARKDOWN_BASE_URL_INTERNAL,
            process.env.BLOG_CONTENT_ASSET_BASE_URL_INTERNAL
        ) ??
        createContentApiConfig(
            'default',
            process.env.BLOG_CONTENT_API_BASE_URL,
            process.env.BLOG_CONTENT_MARKDOWN_BASE_URL,
            process.env.BLOG_CONTENT_ASSET_BASE_URL
        )
    )
}

export function getContentRevalidateSeconds() {
    const rawValue = process.env.BLOG_CONTENT_REVALIDATE_SECONDS?.trim()

    if (!rawValue) {
        return 300
    }

    const parsedValue = Number.parseInt(rawValue, 10)

    if (Number.isNaN(parsedValue) || parsedValue < 0) {
        return 300
    }

    return parsedValue
}

export function getContentApiAuthHeaders() {
    const token = process.env.BLOG_CONTENT_API_TOKEN?.trim()

    if (!token) {
        return {}
    }

    return {
        Authorization: `Bearer ${token}`,
    }
}
