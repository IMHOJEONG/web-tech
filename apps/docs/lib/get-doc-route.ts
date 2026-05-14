import { normalizeDocPath } from '~/lib/normalize-doc-path'

type DocRouteSource = {
    slug?: string | null
    markdownPath?: string | null
    fileName?: string | null
    path?: string | null
}

const CHANNEL_PREFIXES = ['feed/', 'web/', 'mobile/', 'ui-ux/'] as const

function normalizeRouteValue(value?: string | null) {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = normalizeDocPath(value)
        .replace(/\.(mdx|md|html)$/i, '')
        .replace(/^\/+/, '')
        .replace(/\/+$/, '')
        .trim()

    return normalized || null
}

function collapseTrailingDuplicateLeaf(path: string) {
    const segments = path.split('/').filter(Boolean)

    if (segments.length < 2) {
        return path
    }

    const lastSegment = segments.at(-1)
    const previousSegment = segments.at(-2)

    if (lastSegment && previousSegment && lastSegment === previousSegment) {
        return segments.slice(0, -1).join('/')
    }

    return path
}

function normalizeStructuredRoutePath(path: string) {
    return collapseTrailingDuplicateLeaf(path)
}

function mapLocalDataPathToRoute(path: string) {
    if (path.startsWith('data/v8/')) {
        return `web/${path.slice('data/v8/'.length)}`
    }

    if (path.startsWith('data/shadcn/')) {
        return `ui-ux/${path.slice('data/shadcn/'.length)}`
    }

    return null
}

function getStructuredRoutePath(source: DocRouteSource) {
    const candidates = [source.markdownPath, source.fileName, source.path]

    for (const candidate of candidates) {
        const normalized = normalizeRouteValue(candidate)

        if (!normalized || normalized.startsWith('category/')) {
            continue
        }

        const mappedLocalPath = mapLocalDataPathToRoute(normalized)

        if (mappedLocalPath) {
            return normalizeStructuredRoutePath(mappedLocalPath)
        }

        if (CHANNEL_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
            return normalizeStructuredRoutePath(normalized)
        }
    }

    return null
}

export function getDocRoutePath(source: DocRouteSource) {
    const structuredRoutePath = getStructuredRoutePath(source)

    if (structuredRoutePath) {
        return structuredRoutePath
    }

    return normalizeRouteValue(source.slug)
}

export function getDocHref(source: DocRouteSource) {
    const routePath = getDocRoutePath(source)

    return routePath ? `/docs/${routePath}` : '/docs'
}

export function isDocRouteMatch(source: DocRouteSource, routePath: string) {
    const normalizedRoutePath = normalizeRouteValue(routePath)

    if (!normalizedRoutePath) {
        return false
    }

    const derivedRoutePath = getDocRoutePath(source)

    if (derivedRoutePath === normalizedRoutePath) {
        return true
    }

    const normalizedSlug = normalizeRouteValue(source.slug)

    return normalizedSlug === normalizedRoutePath
}
