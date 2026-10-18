import 'server-only'

import {
    ContentApiRequestError,
    readContentApiResponse,
} from './content-api-request.ts'
import { stripHtmlToText } from './remote-html-sanitizer.ts'
import {
    joinUrl,
    getContentApiAuthHeaders,
    getContentApiConfig,
    getContentApiTimeoutMs,
    getContentRevalidateSeconds,
} from '~/lib/content-api-config'
import { REMOTE_CONTENT_CACHE_TAG } from '~/lib/content-cache'
import { normalizeRemoteContent } from '~/lib/content-api-html'
import {
    buildRemotePayloadSchemaFailureEvent,
    reportRemotePayloadSchemaFailure,
} from '~/lib/content-api-observability'
import {
    getInlineContentResult,
    getMarkdownReference,
    getRemotePostSlug,
    normalizeRemotePostMeta,
    normalizeRemoteReference,
    normalizeRemoteSearchResult,
} from '~/lib/content-api-normalize'
import {
    parseRemotePostsPayload,
    remotePayloadSchema,
} from '~/lib/content-api-schema'
import { isDocRouteMatch } from '~/lib/get-doc-route'
import type {
    RemoteContentBody,
    Metadata,
    RemotePost,
    SearchData,
} from '~/lib/content-api-types'

async function fetchRemoteBody(
    post: RemotePost,
    markdownBaseUrl: string | undefined,
    deadline: number
): Promise<RemoteContentBody | null> {
    const inlineContentResult = getInlineContentResult(post)

    if (inlineContentResult && hasReadableBody(inlineContentResult)) {
        return inlineContentResult
    }

    const markdownReference = getMarkdownReference(post)

    if (!markdownReference) {
        return null
    }

    const normalizedReference = normalizeRemoteReference(markdownReference)

    if (!normalizedReference) {
        console.warn(
            '[docs] Rejected unsafe remote markdown reference:',
            markdownReference
        )
        return null
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
        return null
    }

    try {
        const response = await readContentApiResponse(markdownUrl, {
            headers: {
                Accept: 'text/html,text/plain;q=0.9,*/*;q=0.8',
                ...getContentApiAuthHeaders(),
            },
            next: {
                revalidate: getContentRevalidateSeconds(),
                tags: [REMOTE_CONTENT_CACHE_TAG],
            },
            deadline,
        })
        const normalizedContent = normalizeRemoteContent(
            response.text,
            response.contentType
        )

        if (!normalizedContent || !hasReadableBody(normalizedContent)) {
            console.warn('[docs] Rejected non-HTML remote body:', markdownUrl)
            return null
        }

        return normalizedContent
    } catch (error) {
        console.warn(
            '[docs] Failed to fetch markdown body:',
            markdownUrl,
            error
        )
        return null
    }
}

function hasReadableBody(body: RemoteContentBody) {
    return Boolean(
        stripHtmlToText(body.content) ||
        /<(?:img|video|audio)\b/i.test(body.content)
    )
}

async function normalizeRemotePost(
    post: RemotePost,
    markdownBaseUrl?: string,
    assetBaseUrl?: string,
    deadline = Date.now() + getContentApiTimeoutMs()
): Promise<Partial<Metadata> | null> {
    const metadata = normalizeRemotePostMeta(post, assetBaseUrl)

    if (!metadata?.slug || !metadata.title) {
        return null
    }

    const body = await fetchRemoteBody(post, markdownBaseUrl, deadline)
    if (!body) return null

    return {
        ...metadata,
        ...body,
    }
}

async function fetchRemotePostsPayload(
    deadline = Date.now() + getContentApiTimeoutMs()
) {
    const config = getContentApiConfig()

    if (!config) {
        return null
    }

    const url = joinUrl(config.baseUrl, config.postsPath)

    try {
        const response = await readContentApiResponse(url, {
            headers: {
                Accept: 'application/json',
                ...getContentApiAuthHeaders(),
            },
            next: {
                revalidate: getContentRevalidateSeconds(),
                tags: [REMOTE_CONTENT_CACHE_TAG],
            },
            deadline,
        })
        const payload: unknown = JSON.parse(response.text)
        const rawPosts = parseRemotePostsPayload(payload)

        if (!rawPosts) {
            const parseResult = remotePayloadSchema.safeParse(payload)
            const event = buildRemotePayloadSchemaFailureEvent({
                label: config.label,
                url,
                payload,
                issues: parseResult.success ? null : parseResult.error.issues,
            })

            await reportRemotePayloadSchemaFailure(event)

            throw new Error(
                `[docs] Unsupported remote content payload shape (${config.label}): ${url}${event.issues ? ` // ${event.issues}` : ''}`
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
    const deadline = Date.now() + getContentApiTimeoutMs()
    const payload = await fetchRemotePostsPayload(deadline)

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

    const doc = await normalizeRemotePost(
        targetPost,
        payload.config.markdownBaseUrl,
        payload.config.assetBaseUrl,
        deadline
    )
    if (!doc) throw new ContentApiRequestError('empty')
    return doc
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
        .filter((doc): doc is SearchData => doc !== null)
}
