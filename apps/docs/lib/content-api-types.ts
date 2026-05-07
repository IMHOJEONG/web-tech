import type { ContentFormat, ContentSource, Metadata } from '~/lib/get-document'
import type { SearchData } from '~/lib/get-search-data'

export type { ContentFormat, ContentSource, Metadata, SearchData }

export type RemotePost = {
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
    label: 'public' | 'internal' | 'default'
}
