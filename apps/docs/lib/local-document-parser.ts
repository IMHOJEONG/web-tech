import { VFile } from 'vfile'
import { matter as vfileMatter } from 'vfile-matter'
import {
    assertValidLocalDocFrontmatter,
    isPublicDocStatus,
    normalizeLocalDocFrontmatter,
    type LocalDocFrontmatterInput,
} from './editorial-metadata.ts'
import type { Metadata } from './document.types.ts'
import { normalizeDocPath } from './normalize-doc-path.ts'
import { DEFAULT_LOCAL_DOCUMENT_THUMBNAIL } from '../shared/assets/default-thumbnails.ts'

declare module 'vfile' {
    interface DataMap {
        matter: LocalDocFrontmatterInput
    }
}

function normalizeThumbnail(thumbnail?: string | null) {
    let value = thumbnail?.trim()
    if (!value) return DEFAULT_LOCAL_DOCUMENT_THUMBNAIL
    const publicIndex = value.indexOf('public/')
    if (publicIndex !== -1) value = value.slice(publicIndex + 'public/'.length)
    return value.startsWith('/') ? value : `/${value}`
}

export function parseLocalDocument(
    filePath: string,
    relativeFileName: string,
    raw: string
): Metadata | null {
    const vfile = new VFile({ path: filePath, value: raw })
    vfileMatter(vfile, { strip: true })
    const frontmatter = normalizeLocalDocFrontmatter(vfile.data.matter || {})
    assertValidLocalDocFrontmatter(filePath, frontmatter)
    if (!isPublicDocStatus(frontmatter.status)) return null

    const fileName = normalizeDocPath(relativeFileName)
    const fallbackSlug = fileName.split('/').filter(Boolean).pop() ?? ''
    return {
        id: frontmatter.id ?? fileName,
        title: frontmatter.title ?? fallbackSlug,
        slug: frontmatter.slug ?? fallbackSlug,
        summary: frontmatter.summary ?? '',
        date: frontmatter.date ?? '',
        content: String(vfile),
        fileName,
        contentFormat: 'mdx',
        contentSource: 'local',
        thumbnail: normalizeThumbnail(frontmatter.thumbnail),
        updatedAt: frontmatter.updatedAt,
        authorName: frontmatter.authorName,
        authorRole: frontmatter.authorRole,
        readMinutes: frontmatter.readMinutes,
        topicLabel: frontmatter.topicLabel,
        tags: frontmatter.tags,
        status: frontmatter.status,
    }
}
