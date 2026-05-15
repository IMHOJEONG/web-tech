import 'server-only'

import ky from 'ky'
import {
    joinUrl,
    getContentApiAuthHeaders,
    getContentApiConfig,
    getContentRevalidateSeconds,
} from '~/lib/content-api-config'
import { normalizeRemoteContent } from '~/lib/content-api-html'
import {
    getInlineContentResult,
    getMarkdownReference,
    getRemotePostSlug,
    normalizeRemotePostMeta,
    normalizeRemoteReference,
    normalizeRemoteSearchResult,
} from '~/lib/content-api-normalize'
import { isDocRouteMatch } from '~/lib/get-doc-route'
import type {
    ContentFormat,
    Metadata,
    RemotePayload,
    RemotePost,
    SearchData,
} from '~/lib/content-api-types'

function getRemotePosts(payload: RemotePayload) {
    return Array.isArray(payload)
        ? payload
        : Array.isArray(payload.items)
          ? payload.items
          : Array.isArray(payload.results)
            ? payload.results
            : null
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
              `${markdownPathPrefix}/${normalizedReference}`
          )
        : null

    if (!markdownUrl) {
        return {
            content: '',
            contentFormat: 'html' as ContentFormat,
        }
    }

    try {
        const response = await ky.get(markdownUrl, {
            headers: {
                Accept: 'text/html,text/plain;q=0.9,*/*;q=0.8',
                ...getContentApiAuthHeaders(),
            },
            next: {
                revalidate: getContentRevalidateSeconds(),
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
    markdownBaseUrl?: string,
    assetBaseUrl?: string
): Promise<Partial<Metadata> | null> {
    const metadata = normalizeRemotePostMeta(post, assetBaseUrl)

    if (!metadata?.slug || !metadata.title) {
        return null
    }

    const { content, contentFormat } = await fetchRemoteBody(
        post,
        markdownBaseUrl
    )

    return {
        ...metadata,
        content,
        contentFormat,
    }
}

async function fetchRemotePostsPayload() {
    const config = getContentApiConfig()

    if (!config) {
        return null
    }

    const url = joinUrl(config.baseUrl, config.postsPath)

    try {
        const response = await ky.get(url, {
            headers: {
                Accept: 'application/json',
                ...getContentApiAuthHeaders(),
            },
            next: {
                revalidate: getContentRevalidateSeconds(),
            },
            throwHttpErrors: false,
        })

        if (!response.ok) {
            throw new Error(
                `[docs] Remote content request failed (${config.label}): ${url} ${response.status}`
            )
        }

        const payload = (await response.json()) as RemotePayload
        const rawPosts = getRemotePosts(payload)

        if (!rawPosts) {
            throw new Error(
                `[docs] Unsupported remote content payload shape (${config.label}): ${url}`
            )
        }

        return {
            config,
            rawPosts,
        }
    } catch (error) {
        console.warn(
            '[docs] Remote content request failed:',
            config.label,
            url,
            error
        )

        throw new Error(
            `[docs] Failed to fetch remote content from configured ${config.label} endpoint.`
        )
    }
}

export async function fetchRemoteDocsData() {
    const payload = await fetchRemotePostsPayload()

    if (!payload) {
        return null
    }

    return payload.rawPosts
        .map((post) =>
            normalizeRemotePostMeta(post, payload.config.assetBaseUrl)
        )
        .filter((post): post is Partial<Metadata> => post !== null)
}

export async function fetchRemoteDocByRoutePath(routePath: string) {
    const payload = await fetchRemotePostsPayload()

    if (!payload) {
        return null
    }

    const targetPost = payload.rawPosts.find((post) =>
        isDocRouteMatch(
            {
                slug: getRemotePostSlug(post),
                markdownPath: getMarkdownReference(post),
                fileName: post.fileName,
                path: post.path,
            },
            routePath
        )
    )

    if (!targetPost) {
        return null
    }

    return normalizeRemotePost(
        targetPost,
        payload.config.markdownBaseUrl,
        payload.config.assetBaseUrl
    )
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
        .map((doc) => normalizeRemoteSearchResult(doc))
        .filter(Boolean) as SearchData[]
}
