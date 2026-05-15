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
    author?: string
    author_name?: string
    authorName?: string
    author_role?: string
    authorRole?: string
    role?: string
    read_minutes?: number | string
    readMinutes?: number | string
    reading_time?: number | string
    readingTime?: number | string
    read_time?: number | string
    readTime?: number | string
    topic?: string
    topic_label?: string
    topicLabel?: string
    section_label?: string
    sectionLabel?: string
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
    assetBaseUrl?: string
    label: 'public' | 'internal' | 'default'
}
