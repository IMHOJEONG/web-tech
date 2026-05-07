import 'server-only'

import ky from 'ky'
import sanitizeHtml from 'sanitize-html'
import type { Metadata } from '~/lib/get-document'
import type { ContentFormat } from '~/lib/get-document'
import type { ContentSource } from '~/lib/get-document'
import type { SearchData } from '~/lib/get-search-data'
import { normalizeDocPath } from '~/lib/normalize-doc-path'

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

const ALLOWED_REMOTE_HTML_TAGS = [
    'a',
    'abbr',
    'article',
    'aside',
    'b',
    'blockquote',
    'br',
    'caption',
    'code',
    'col',
    'colgroup',
    'dd',
    'del',
    'details',
    'div',
    'dl',
    'dt',
    'em',
    'figcaption',
    'figure',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hr',
    'i',
    'img',
    'ins',
    'li',
    'mark',
    'ol',
    'p',
    'picture',
    'pre',
    'section',
    'small',
    'source',
    'span',
    'strong',
    'sub',
    'summary',
    'sup',
    'table',
    'tbody',
    'td',
    'tfoot',
    'th',
    'thead',
    'tr',
    'u',
    'ul',
] as const

const ALLOWED_REMOTE_HTML_ATTRIBUTES: Record<string, string[]> = {
    '*': ['aria-*', 'class', 'data-*', 'dir', 'id', 'lang', 'role', 'title'],
    a: ['href', 'name', 'rel', 'target'],
    img: ['alt', 'height', 'loading', 'src', 'srcset', 'width'],
    source: ['media', 'sizes', 'src', 'srcset', 'type'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan', 'scope'],
    col: ['span', 'width'],
}

function trimTrailingSlash(value: string) {
    return value.replace(/\/+$/, '')
}

function trimLeadingSlash(value: string) {
    return value.replace(/^\/+/, '')
}

function joinUrl(base: string, path: string) {
    return `${trimTrailingSlash(base)}/${trimLeadingSlash(path)}`
}

function parseCsvEnv(value?: string | null) {
    if (!value) {
        return []
    }

    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
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
    return sanitizeHtml(content, {
        allowedTags: [...ALLOWED_REMOTE_HTML_TAGS],
        allowedAttributes: ALLOWED_REMOTE_HTML_ATTRIBUTES,
        disallowedTagsMode: 'discard',
        allowedSchemes: ['http', 'https', 'mailto', 'ftp'],
        allowedSchemesAppliedToAttributes: ['href', 'src', 'srcset'],
        allowProtocolRelative: false,
        parser: {
            lowerCaseAttributeNames: true,
        },
        transformTags: {
            a: (tagName, attribs) => {
                const sanitizedAttribs = { ...attribs }

                if (sanitizedAttribs.target === '_blank') {
                    sanitizedAttribs.rel = 'noopener noreferrer'
                }

                return {
                    tagName,
                    attribs: sanitizedAttribs,
                }
            },
        },
    })
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

function getContentApiAuthHeaders() {
    const token = process.env.BLOG_CONTENT_API_TOKEN?.trim()

    if (!token) {
        return {}
    }

    return {
        Authorization: `Bearer ${token}`,
    }
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
        const authHeaders = getContentApiAuthHeaders()
        const response = await ky.get(markdownUrl, {
            headers: {
                Accept: 'text/html,text/plain;q=0.9,*/*;q=0.8',
                ...authHeaders,
            },
            next: {
                revalidate: revalidateSeconds,
            },
            throwHttpErrors: false,
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
    const fileName = normalizeDocPath(
        post.fileName ?? post.path ?? markdownPath ?? `remote/${slug}`
    )

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

type ContentApiConfig = {
    baseUrl: string
    postsPath: string
    markdownBaseUrl?: string
    label: string
}

function createContentApiConfig(
    label: string,
    baseUrl?: string,
    markdownBaseUrl?: string
): ContentApiConfig | null {
    const normalizedBaseUrl = baseUrl?.trim()

    if (!normalizedBaseUrl) {
        return null
    }

    const normalizedMarkdownBaseUrl = markdownBaseUrl?.trim()

    return {
        label,
        baseUrl: normalizedBaseUrl,
        postsPath:
            process.env.BLOG_CONTENT_API_POSTS_PATH?.trim() || '/api/posts',
        markdownBaseUrl:
            normalizedMarkdownBaseUrl || normalizedBaseUrl || undefined,
    }
}

function dedupeContentApiConfigs(configs: ContentApiConfig[]) {
    const seen = new Set<string>()

    return configs.filter((config) => {
        const key = [
            trimTrailingSlash(config.baseUrl),
            trimTrailingSlash(config.markdownBaseUrl ?? ''),
            config.postsPath,
        ].join('|')

        if (seen.has(key)) {
            return false
        }

        seen.add(key)
        return true
    })
}

function getContentApiConfigs() {
    const configs: ContentApiConfig[] = []

    const csvApiBases = parseCsvEnv(process.env.BLOG_CONTENT_API_BASE_URLS)
    const csvMarkdownBases = parseCsvEnv(
        process.env.BLOG_CONTENT_MARKDOWN_BASE_URLS
    )

    csvApiBases.forEach((baseUrl, index) => {
        const config = createContentApiConfig(
            `csv:${index + 1}`,
            baseUrl,
            csvMarkdownBases[index]
        )

        if (config) {
            configs.push(config)
        }
    })

    const namedConfigs = [
        createContentApiConfig(
            'internal',
            process.env.BLOG_CONTENT_API_BASE_URL_INTERNAL,
            process.env.BLOG_CONTENT_MARKDOWN_BASE_URL_INTERNAL
        ),
        createContentApiConfig(
            'public',
            process.env.BLOG_CONTENT_API_BASE_URL_PUBLIC,
            process.env.BLOG_CONTENT_MARKDOWN_BASE_URL_PUBLIC
        ),
        createContentApiConfig(
            'default',
            process.env.BLOG_CONTENT_API_BASE_URL,
            process.env.BLOG_CONTENT_MARKDOWN_BASE_URL
        ),
    ].filter((config): config is ContentApiConfig => config !== null)

    configs.push(...namedConfigs)

    return dedupeContentApiConfigs(configs)
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
    const configs = getContentApiConfigs()

    if (configs.length === 0) {
        return null
    }

    const revalidateSeconds = getContentRevalidateSeconds()
    const authHeaders = getContentApiAuthHeaders()

    for (const config of configs) {
        const url = joinUrl(config.baseUrl, config.postsPath)

        try {
            const response = await ky.get(url, {
                headers: {
                    Accept: 'application/json',
                    ...authHeaders,
                },
                next: {
                    revalidate: revalidateSeconds,
                },
                throwHttpErrors: false,
            })

            if (!response.ok) {
                console.warn(
                    '[docs] Failed to fetch remote markdown list:',
                    config.label,
                    url,
                    response.status
                )
                continue
            }

            const payload = (await response.json()) as RemotePayload
            const rawPosts = getRemotePosts(payload)

            if (!rawPosts) {
                console.warn(
                    '[docs] Unsupported remote markdown payload shape:',
                    config.label,
                    url
                )
                continue
            }

            return {
                config,
                rawPosts,
            }
        } catch (error) {
            console.warn(
                '[docs] Remote markdown fetch candidate failed:',
                config.label,
                url,
                error
            )
        }
    }

    throw new Error(
        '[docs] Failed to fetch remote content from every configured content API candidate.'
    )
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
