import fs from 'node:fs/promises'
import path from 'node:path'
import { parseLocalDocument } from './local-document-parser.ts'
import { getDocHref } from './get-doc-route.ts'
import { listLocalMarkdownFiles } from './local-markdown-files.ts'
import type { SearchData } from './get-search-data'
import { getDocumentTaxonomy } from './document-taxonomy.ts'

export function inferSearchSection(fileName: string) {
    return getDocumentTaxonomy(fileName).section
}

export async function loadLocalSearchIndex(
    root: string
): Promise<SearchData[]> {
    const files = listLocalMarkdownFiles(root)
    const parsed = await Promise.all(
        files.map(async (file) => {
            const raw = await fs.readFile(file, 'utf8')
            const doc = parseLocalDocument(
                file,
                path.relative(root, file).replace(/\.(mdx|md)$/i, ''),
                raw
            )
            if (!doc) return null
            return {
                id: doc.id,
                title: doc.title,
                summary: doc.summary,
                content: doc.content.trim(),
                slug: doc.slug,
                fileName: doc.fileName,
                date: doc.date || undefined,
                thumbnail: doc.thumbnail,
                updatedAt: doc.updatedAt,
                href: getDocHref(doc),
                section: inferSearchSection(doc.fileName),
                contentSource: 'local' as const,
                readMinutes: doc.readMinutes,
                topicLabel: doc.topicLabel,
                tags: doc.tags,
            }
        })
    )
    const docs = parsed
        .filter((doc) => doc !== null)
        .sort(
            (a, b) =>
                (b.date ? new Date(b.date).getTime() : 0) -
                (a.date ? new Date(a.date).getTime() : 0)
        )
    console.info('[docs.search_index_build]', { documentCount: docs.length })
    return docs
}
