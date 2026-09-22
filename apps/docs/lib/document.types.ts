import type { EditorialStatus } from './editorial-metadata.ts'

export type ContentFormat = 'mdx' | 'html'
export type ContentSource = 'local' | 'remote'

export interface Metadata {
    readonly id: string
    readonly title: string
    readonly date: string
    readonly summary: string
    readonly slug: string
    readonly content: string
    readonly fileName: string
    readonly contentFormat?: ContentFormat
    readonly contentSource?: ContentSource
    readonly markdownPath?: string | null
    readonly thumbnail?: string | null
    readonly updatedAt?: string
    readonly authorName?: string
    readonly authorRole?: string
    readonly readMinutes?: number
    readonly topicLabel?: string
    readonly tags?: readonly string[]
    readonly status?: EditorialStatus
}
