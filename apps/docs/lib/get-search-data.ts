// lib/get-search-data.ts
import 'server-only'

import { randomUUID } from 'crypto'
import fg from 'fast-glob'
import fs from 'fs/promises'
import { read } from 'to-vfile'
import { matter } from 'vfile-matter'
import { fetchRemoteSearchData } from '~/lib/content-api'

export type SearchData = {
    slug: string
    title?: string
    content: string
    excerpt: string
    path: string
    id: string
}

// const CONTENT_DIRS = [
//     path.join(process.cwd(), 'data'),
//     path.join(process.cwd(), 'category'),
//     // path.join(process.cwd(), 'content/notes'),
// ]

/**
 * 모든 mdx를 읽고
 * keyword가 있으면 content에 포함된 것만 반환
 */
export async function getSearchData(keyword?: string): Promise<SearchData[]> {
    const remoteResults = await fetchRemoteSearchData(keyword)

    if (remoteResults) {
        return remoteResults
    }

    const files = await fg('**/*.mdx', {
        cwd: process.cwd(),
        absolute: true,
    })

    const results: SearchData[] = []

    for (const filePath of files) {
        const raw = await fs.readFile(filePath, 'utf-8')

        const slug = filePath.replace(/\\/g, '/').replace(/\.mdx$/, '')

        // 간단한 frontmatter title 추출 (선택)
        const titleMatch = raw.match(/title:\s*(.+)/)
        const title = titleMatch?.[1]?.replace(/['"]/g, '')

        // mdx에서 실제 content만 대충 정제
        const content = raw
            .replace(/---[\s\S]*?---/, '') // frontmatter 제거
            .trim()

        // 2. vfile-matter
        const fileTest = await read(filePath)
        matter(fileTest, { strip: true })

        if (keyword && !content.toLowerCase().includes(keyword.toLowerCase())) {
            continue
        }

        results.push({
            slug,
            id: `${fileTest.data.matter?.title} ${randomUUID()}`,
            title,
            content,
            excerpt: content.slice(0, 200),
            path: filePath,
        })
    }

    return results
}
