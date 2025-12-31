import fg from 'fast-glob'
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

const categoryDirectory = path.join(process.cwd(), 'category')

export const subCategories = fs
    .readdirSync(categoryDirectory, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => path.join(categoryDirectory, dirent.name))

async function exploreDirectory(path: string) {
    const files = await fg(path)
    return files
}

export async function getSubCategoryData(main: string, sub: string) {
    const fileNames = await exploreDirectory(
        `category/${main}/${sub}/*.{md,mdx}`
    )

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

export async function getCategoryData() {
    const fileNames = await exploreDirectory(`category`)

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
