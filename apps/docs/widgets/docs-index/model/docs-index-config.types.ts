import type {
    DocsIndexSectionKey,
    getDocsIndexSectionMessageKey,
} from './docs-index-summary'

export interface DocsIndexSectionFilterConfig {
    value: string
    section: DocsIndexSectionKey | null
    messageKey: ReturnType<typeof getDocsIndexSectionMessageKey> | 'all'
}
