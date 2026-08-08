import type { ContentFormat, ContentSource, Metadata } from '~/lib/get-document'
import type { SearchData } from '~/lib/get-search-data'

export type { ContentFormat, ContentSource, Metadata, SearchData }

export type RemotePost = {
    id?: string | number | null
    slug?: string | null
    title?: string | null
    summary?: string | null
    date?: string | number | null
    updated_at?: string | number | null
    updatedAt?: string | number | null
    content?: string | null
    body_markdown?: string | null
    bodyMarkdown?: string | null
    markdown?: string | null
    body?: string | null
    thumbnail?: string | null
    thumbnail_url?: string | null
    thumbnailUrl?: string | null
    fileName?: string | null
    path?: string | null
    markdown_path?: string | null
    markdownPath?: string | null
    md_path?: string | null
    mdPath?: string | null
    markdown_url?: string | null
    markdownUrl?: string | null
    md_url?: string | null
    mdUrl?: string | null
    author?: string | null
    author_name?: string | null
    authorName?: string | null
    author_role?: string | null
    authorRole?: string | null
    role?: string | null
    read_minutes?: number | string | null
    readMinutes?: number | string | null
    reading_time?: number | string | null
    readingTime?: number | string | null
    read_time?: number | string | null
    readTime?: number | string | null
    topic?: string | null
    topic_label?: string | null
    topicLabel?: string | null
    section_label?: string | null
    sectionLabel?: string | null
    tags?: string[] | string | null
    tag_list?: string[] | string | null
    tagList?: string[] | string | null
    status?: string | null
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
