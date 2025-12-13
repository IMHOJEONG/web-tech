import fs from 'fs'
import path from 'path'
import { VFile } from 'vfile'
import { matter as vfileMatter } from 'vfile-matter'

export interface Metadata {
    id: string
    title: string
    date: string
    summary: string
    slug: string
    content: string
    fileName: string
    thumbnail?: string | null
}

const docsDirectory = path.join(process.cwd(), 'data-architecture')

function exploreDirectory(directory: string) {
    let files: string[] = []
    try {
        const items = fs.readdirSync(directory, { withFileTypes: true })
        for (const item of items) {
            const fullPath = path.join(directory, item.name)

            if (item.isDirectory()) {
                files = files.concat(exploreDirectory(fullPath)) // 재귀 호출
            } else if (item.isFile()) {
                // md, mdx 파일만 허용
                if (/\.(mdx?|MDX?)$/.test(item.name)) {
                    files.push(fullPath)
                }
            }
        }
    } catch (error) {
        console.error('Error reading directory:', directory, error)
    }

    return files
}

export function getArchitecturesData() {
    console.log(exploreDirectory(docsDirectory))

    const fileNames = exploreDirectory(docsDirectory)

    const allPostsData: Partial<Metadata>[] = fileNames.map((fileName) => {
        // Remove ".md" from file name to get id
        const id = fileName.replace(/\.mdx?$/, '')

        // Read markdown file as string
        console.log(fileName)
        const fileContents = fs.readFileSync(fileName, 'utf8')
        // Use vfile-matter to parse the post metadata section
        const vfile = new VFile({ path: fileName, value: fileContents })
        vfileMatter(vfile, { strip: true })
        const data = vfile.data.matter || {}
        const content = String(vfile)
        // 프로젝트 루트 기준의 상대경로(확장자 없는)만 추출
        const relPathFromRoot = path
            .relative(process.cwd(), fileName)
            .replace(/\.(mdx|md)$/i, '')

        console.log(relPathFromRoot)
        // thumbnail 경로를 public 폴더 기준으로 /로 시작하게 단순화, 타입 안전하게
        let thumbnailPath: string | null = null
        if (typeof data.thumbnail === 'string') {
            const trimmed = data.thumbnail.trim()
            if (trimmed.length > 0) {
                thumbnailPath = trimmed
                const idx = thumbnailPath.indexOf('public/')
                if (idx !== -1) {
                    thumbnailPath = thumbnailPath.slice(idx + 'public/'.length)
                }
                if (!thumbnailPath.startsWith('/')) {
                    thumbnailPath = '/' + thumbnailPath
                }
            }
        }
        return {
            id,
            ...data,
            use: data.use ?? [],
            content,
            fileName: relPathFromRoot,
            thumbnail: thumbnailPath,
        }
    })
    console.log(allPostsData)

    return allPostsData
}

export function getSortedPostsData() {
    const allPostsData = getArchitecturesData()
    return allPostsData.sort((a, b) => {
        if (a.date && b.date && a.date < b.date) {
            return 1
        } else {
            return -1
        }
    })
}
