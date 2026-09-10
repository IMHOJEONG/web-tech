import type { RemotePostContract } from '@web-tech/docs-content-contract'
import type { ContentFormat, ContentSource, Metadata } from '~/lib/get-document'
import type { SearchData } from '~/lib/get-search-data'

export type { ContentFormat, ContentSource, Metadata, SearchData }

export type RemotePost = RemotePostContract

export type RemotePayload =
    | RemotePost[]
    | {
          items?: RemotePost[]
          results?: RemotePost[]
      }

export type ContentApiConfig = {
    baseUrl: string
    postsPath: string
    markdownBaseUrl?: string
    assetBaseUrl?: string
    label: 'public' | 'internal' | 'default'
}
