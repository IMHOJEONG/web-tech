import { readFileSync } from 'node:fs'
import path from 'node:path'
import { resolveLocalContentRoot } from './local-content-paths.ts'
import { listLocalMarkdownFiles } from './local-markdown-files.ts'
import { parseLocalDocument } from './local-document-parser.ts'

export function getLocalDraftPreview(routePath: string, contentRoot?: string) {
    if (process.env.NODE_ENV !== 'development') return null
    if (!/^(?:data|category)(?:\/[\w-]+)+$/.test(routePath)) return null
    const draftRoot = process.env.DOCS_LOCAL_DRAFT_ROOT?.trim()
    if (!contentRoot && draftRoot && !path.isAbsolute(draftRoot)) {
        throw new Error('DOCS_LOCAL_DRAFT_ROOT must be an absolute path')
    }
    const root = contentRoot ?? (draftRoot || resolveLocalContentRoot())
    const file = listLocalMarkdownFiles(root).find(
        (candidate) =>
            path.relative(root, candidate).replace(/\.(mdx|md)$/i, '') ===
            routePath
    )
    if (!file) return null
    const doc = parseLocalDocument(
        file,
        routePath,
        readFileSync(file, 'utf8'),
        {
            previewDraft: true,
        }
    )
    return doc?.status === 'draft' ? doc : null
}
