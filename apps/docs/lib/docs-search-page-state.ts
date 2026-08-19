import type { SearchData } from './get-search-data'

export const RECOMMENDED_SEARCH_TERMS = [
    'React',
    'Astro',
    'Accessibility',
    'V8',
    'Node.js',
    'OS',
] as const

export type DocsSearchPageState =
    | {
          mode: 'empty-all-docs'
      }
    | {
          mode: 'empty-search'
          keyword: string
      }
    | {
          mode: 'index'
          docs: SearchData[]
      }
    | {
          mode: 'search-results'
          keyword: string
          docs: SearchData[]
      }

export function resolveDocsSearchPageState(input: {
    query?: string | null
    docs: SearchData[]
    searchResults: SearchData[]
}): DocsSearchPageState {
    const keyword = input.query?.trim() ?? ''

    if (!input.query && input.docs.length === 0) {
        return {
            mode: 'empty-all-docs',
        }
    }

    if (keyword && input.searchResults.length === 0) {
        return {
            mode: 'empty-search',
            keyword,
        }
    }

    if (!keyword) {
        return {
            mode: 'index',
            docs: input.docs,
        }
    }

    return {
        mode: 'search-results',
        keyword,
        docs: input.searchResults,
    }
}
