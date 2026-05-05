import 'server-only'

import { JSDOM } from 'jsdom'
import type { Metadata } from '~/lib/get-document'
import type { ContentFormat } from '~/lib/get-document'
import type { ContentSource } from '~/lib/get-document'
import type { SearchData } from '~/lib/get-search-data'

type RemotePost = {
    id?: string | number
    slug?: string
    title?: string
    summary?: string
    date?: string
    content?: string
    body_markdown?: string
    bodyMarkdown?: string
    markdown?: string
    body?: string
    thumbnail?: string | null
    thumbnail_url?: string | null
    thumbnailUrl?: string | null
    fileName?: string
    path?: string
    markdown_path?: string
    markdownPath?: string
    md_path?: string
    mdPath?: string
    markdown_url?: string
    markdownUrl?: string
    md_url?: string
    mdUrl?: string
}

type RemotePayload =
    | RemotePost[]
    | {
          items?: RemotePost[]
          results?: RemotePost[]
      }

const DISALLOWED_REMOTE_TAGS = [
    'script',
    'style',
    'iframe',
    'object',
    'embed',
    'form',
    'meta',
    'link',
    'base',
] as const

const URL_ATTRIBUTE_NAMES = new Set([
    'href',
    'src',
    'xlink:href',
    'action',
    'formaction',
    'poster',
])

function trimTrailingSlash(value: string) {
    return value.replace(/\/+$/, '')
}

function trimLeadingSlash(value: string) {
    return value.replace(/^\/+/, '')
}

function joinUrl(base: string, path: string) {
    return `${trimTrailingSlash(base)}/${trimLeadingSlash(path)}`
}

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

function getMarkdownReference(post: RemotePost) {
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

function getRemotePostSlug(post: RemotePost) {
    return (
        post.slug?.trim() ||
        String(post.id ?? '').trim() ||
        getFallbackSlug(post)
    )
}

function getRemotePostTitle(post: RemotePost, slug: string) {
    return post.title?.trim() || formatFallbackTitle(slug)
}

function inferContentFormat(
    content: string,
    contentType?: string | null
): ContentFormat {
    if (contentType?.toLowerCase().includes('text/html')) {
        return 'html'
    }

    const trimmedContent = content.trim()

    if (
        /^<!doctype html/i.test(trimmedContent) ||
        /^<html[\s>]/i.test(trimmedContent) ||
        /^<article[\s>]/i.test(trimmedContent) ||
        /^<section[\s>]/i.test(trimmedContent) ||
        /^<div[\s>]/i.test(trimmedContent) ||
        /^<h[1-6][\s>]/i.test(trimmedContent)
    ) {
        return 'html'
    }

    return 'mdx'
}

function normalizeRemoteReference(reference: string) {
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

    return trimLeadingSlash(trimmedReference)
}

function sanitizeRemoteHtml(content: string) {
    const dom = new JSDOM(content)
    const { document } = dom.window

    DISALLOWED_REMOTE_TAGS.forEach((tagName) => {
        document.querySelectorAll(tagName).forEach((node) => node.remove())
    })

    document.querySelectorAll('*').forEach((element) => {
        Array.from(element.attributes).forEach((attribute) => {
            const attributeName = attribute.name.toLowerCase()

            if (attributeName.startsWith('on') || attributeName === 'srcdoc') {
                element.removeAttribute(attribute.name)
                return
            }

            if (!URL_ATTRIBUTE_NAMES.has(attributeName)) {
                return
            }

            const normalizedValue = attribute.value
                .replace(/[\u0000-\u0020\u007f-\u009f]+/g, '')
                .toLowerCase()

            if (
                normalizedValue.startsWith('javascript:') ||
                normalizedValue.startsWith('vbscript:')
            ) {
                element.setAttribute(attribute.name, '#')
            }
        })
    })

    return document.body.innerHTML
}

function normalizeRemoteContent(
    content: string,
    contentType?: string | null
): { content: string; contentFormat: ContentFormat } | null {
    const detectedContentFormat = inferContentFormat(content, contentType)

    if (detectedContentFormat !== 'html') {
        return null
    }

    return {
        content: sanitizeRemoteHtml(content),
        contentFormat: 'html',
    }
}

function getInlineContentResult(post: RemotePost) {
    const content = getInlineMarkdown(post).trim()

    if (!content) {
        return null
    }

    return normalizeRemoteContent(content, null)
}

async function fetchRemoteBody(post: RemotePost, markdownBaseUrl?: string) {
    const inlineContentResult = getInlineContentResult(post)

    if (inlineContentResult) {
        return inlineContentResult
    }

    const markdownReference = getMarkdownReference(post)

    if (!markdownReference) {
        return {
            content: '',
            contentFormat: 'html' as ContentFormat,
        }
    }

    const normalizedReference = normalizeRemoteReference(markdownReference)

    if (!normalizedReference) {
        console.warn(
            '[docs] Rejected unsafe remote markdown reference:',
            markdownReference
        )
        return {
            content: '',
            contentFormat: 'html' as ContentFormat,
        }
    }

    const markdownPathPrefix =
        process.env.BLOG_CONTENT_MARKDOWN_PATH_PREFIX?.trim() || '/posts'

    const markdownUrl = markdownBaseUrl
        ? joinUrl(
              markdownBaseUrl,
              `${trimTrailingSlash(markdownPathPrefix)}/${normalizedReference}`
          )
        : null

    if (!markdownUrl) {
        return {
            content: '',
            contentFormat: 'html' as ContentFormat,
        }
    }

    try {
        const revalidateSeconds = getContentRevalidateSeconds()
        const response = await fetch(markdownUrl, {
            method: 'GET',
            headers: {
                Accept: 'text/html,text/plain;q=0.9,*/*;q=0.8',
            },
            next: {
                revalidate: revalidateSeconds,
            },
        })

        if (!response.ok) {
            console.warn(
                '[docs] Failed to fetch markdown body:',
                markdownUrl,
                response.status
            )
            return {
                content: '',
                contentFormat: 'html' as ContentFormat,
            }
        }

        const content = await response.text()
        const normalizedContent = normalizeRemoteContent(
            content,
            response.headers.get('content-type')
        )

        if (!normalizedContent) {
            console.warn(
                '[docs] Rejected non-HTML remote body:',
                markdownUrl,
                response.headers.get('content-type')
            )
            return {
                content: '',
                contentFormat: 'html' as ContentFormat,
            }
        }

        return normalizedContent
    } catch (error) {
        console.warn(
            '[docs] Failed to fetch markdown body:',
            markdownUrl,
            error
        )
        return {
            content: '',
            contentFormat: 'html' as ContentFormat,
        }
    }
}

async function normalizeRemotePost(
    post: RemotePost,
    markdownBaseUrl?: string
): Promise<Partial<Metadata> | null> {
    const slug = getRemotePostSlug(post)
    const title = getRemotePostTitle(post, slug)

    if (!slug || !title) {
        return null
    }

    const { content, contentFormat } = await fetchRemoteBody(
        post,
        markdownBaseUrl
    )
    const markdownPath = getMarkdownReference(post)

    const summary = post.summary?.trim() ?? ''
    const date = post.date?.trim() ?? ''
    const id = String(post.id ?? slug)
    const fileName =
        post.fileName ?? post.path ?? markdownPath ?? `remote/${slug}`

    return {
        id,
        slug,
        title,
        summary,
        date,
        content,
        fileName,
        contentFormat,
        contentSource: 'remote' as ContentSource,
        markdownPath,
        thumbnail: normalizeThumbnailPath(
            post.thumbnail ?? post.thumbnail_url ?? post.thumbnailUrl
        ),
    }
}

function normalizeRemotePostMeta(post: RemotePost): Partial<Metadata> | null {
    const slug = getRemotePostSlug(post)
    const title = getRemotePostTitle(post, slug)

    if (!slug || !title) {
        return null
    }

    const summary = post.summary?.trim() ?? ''
    const date = post.date?.trim() ?? ''
    const id = String(post.id ?? slug)
    const markdownPath = getMarkdownReference(post)
    const fileName =
        post.fileName ?? post.path ?? markdownPath ?? `remote/${slug}`

    return {
        id,
        slug,
        title,
        summary,
        date,
        content: '',
        fileName,
        contentFormat: 'html',
        contentSource: 'remote' as ContentSource,
        markdownPath,
        thumbnail: normalizeThumbnailPath(
            post.thumbnail ?? post.thumbnail_url ?? post.thumbnailUrl
        ),
    }
}

function normalizeSearchResult(post: Partial<Metadata>): SearchData | null {
    if (!post.slug) {
        return null
    }

    const content = post.content ?? ''
    const summary = post.summary || content.slice(0, 200)
    const fileName = post.markdownPath ?? post.fileName ?? `remote/${post.slug}`

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

function getContentApiConfig() {
    const baseUrl = process.env.BLOG_CONTENT_API_BASE_URL?.trim()

    if (!baseUrl) {
        return null
    }

    return {
        baseUrl,
        postsPath:
            process.env.BLOG_CONTENT_API_POSTS_PATH?.trim() || '/api/posts',
        markdownBaseUrl:
            process.env.BLOG_CONTENT_MARKDOWN_BASE_URL?.trim() || undefined,
    }
}

function getContentRevalidateSeconds() {
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

function getRemotePosts(payload: RemotePayload) {
    return Array.isArray(payload)
        ? payload
        : Array.isArray(payload.items)
          ? payload.items
          : Array.isArray(payload.results)
            ? payload.results
            : null
}

async function fetchRemotePostsPayload() {
    const config = getContentApiConfig()

    if (!config) {
        return null
    }

    const url = joinUrl(config.baseUrl, config.postsPath)

    try {
        const revalidateSeconds = getContentRevalidateSeconds()
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
            next: {
                revalidate: revalidateSeconds,
            },
        })

        if (!response.ok) {
            console.warn(
                '[docs] Failed to fetch remote markdown list:',
                url,
                response.status
            )
            return null
        }

        const payload = (await response.json()) as RemotePayload
        const rawPosts = getRemotePosts(payload)

        if (!rawPosts) {
            console.warn(
                '[docs] Unsupported remote markdown payload shape:',
                url
            )
            return null
        }

        return {
            config,
            rawPosts,
        }
    } catch (error) {
        console.warn(
            '[docs] Remote markdown fetch fallback to local files:',
            error
        )
        return null
    }
}

export async function fetchRemoteDocsData() {
    const payload = await fetchRemotePostsPayload()

    if (!payload) {
        return null
    }

    return payload.rawPosts
        .map((post) => normalizeRemotePostMeta(post))
        .filter((post): post is Partial<Metadata> => post !== null)
}

export async function fetchRemoteDocBySlug(slug: string) {
    const payload = await fetchRemotePostsPayload()

    if (!payload) {
        return null
    }

    const targetPost = payload.rawPosts.find(
        (post) => getRemotePostSlug(post) === slug
    )

    if (!targetPost) {
        return null
    }

    return normalizeRemotePost(targetPost, payload.config.markdownBaseUrl)
}

export async function fetchRemoteSearchData(keyword?: string) {
    const docs = await fetchRemoteDocsData()

    if (!docs) {
        return null
    }

    const normalizedKeyword = keyword?.trim().toLowerCase()
    const filtered = !normalizedKeyword
        ? docs
        : docs.filter((doc) => {
              const haystack = [doc.title, doc.summary, doc.slug, doc.content]
                  .filter(Boolean)
                  .join(' ')
                  .toLowerCase()

              return haystack.includes(normalizedKeyword)
          })

    return filtered
        .map((doc) => normalizeSearchResult(doc))
        .filter(Boolean) as SearchData[]
}
