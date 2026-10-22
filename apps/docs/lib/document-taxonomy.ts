import { normalizeDocPath } from './normalize-doc-path.ts'

export type DocChannel = 'web' | 'mobile' | 'uiux' | 'other'
export type DocumentSection =
    | 'Web'
    | 'Mobile'
    | 'UI/UX'
    | 'Backend'
    | 'Infrastructure'
    | 'Computer Science'
    | 'Docs'

export type DocumentTaxonomySource =
    | string
    | {
          markdownPath?: string | null
          href?: string | null
          fileName?: string | null
          path?: string | null
      }
    | null
    | undefined

function getClassificationPath(source: DocumentTaxonomySource) {
    const candidates =
        typeof source === 'string'
            ? [source]
            : [
                  source?.markdownPath,
                  source?.href,
                  source?.fileName,
                  source?.path,
              ]
    const value = candidates.find((candidate) => candidate?.trim()) ?? ''

    const normalized = normalizeDocPath(value.trim())
    const publicPath = normalized.replace(/^(?:\/)?(?:(?:ko|en)\/)?docs\//, '')
    const path =
        publicPath !== normalized
            ? publicPath
            : normalized.replace(/^(?:\/(?:[^/]+\/)*)?apps\/docs\//, '')

    return path.replace(/^\/+|\/+$/g, '').replace(/\.(?:mdx?|html)$/i, '')
}

export function getDocumentTaxonomy(source: DocumentTaxonomySource): {
    section: DocumentSection
    channel: DocChannel
} {
    const path = getClassificationPath(source)

    if (
        path.startsWith('mobile/') ||
        path.startsWith('category/mobile/') ||
        /^category\/fe\/(?:react-native|ios|android)\//.test(path)
    ) {
        return { section: 'Mobile', channel: 'mobile' }
    }
    if (path.startsWith('ui-ux/') || path.startsWith('data/shadcn/')) {
        return { section: 'UI/UX', channel: 'uiux' }
    }
    if (
        path.startsWith('web/') ||
        path.startsWith('category/fe/') ||
        path.startsWith('data/v8/')
    ) {
        return { section: 'Web', channel: 'web' }
    }
    if (path.startsWith('category/be/')) {
        return { section: 'Backend', channel: 'other' }
    }
    if (path.startsWith('category/infra/')) {
        return { section: 'Infrastructure', channel: 'other' }
    }
    if (path.startsWith('category/computer-science/')) {
        return { section: 'Computer Science', channel: 'other' }
    }
    return { section: 'Docs', channel: 'other' }
}
