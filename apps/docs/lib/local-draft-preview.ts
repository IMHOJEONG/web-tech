import { readFileSync } from 'node:fs'
import path from 'node:path'
import { resolveLocalContentRoot } from './local-content-paths.ts'
import { listLocalMarkdownFiles } from './local-markdown-files.ts'
import { parseLocalDocument } from './local-document-parser.ts'

export function getLocalDraftPreview(
    routePath: string,
    contentRoot = resolveLocalContentRoot()
) {
    if (process.env.NODE_ENV !== 'development') return null
    if (!/^(?:data|category)(?:\/[\w-]+)+$/.test(routePath)) return null
    const file = listLocalMarkdownFiles(contentRoot).find(
        (candidate) =>
            path
                .relative(contentRoot, candidate)
                .replace(/\.(mdx|md)$/i, '') === routePath
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
