import fs from 'fs'
import matter from 'gray-matter'
import path from 'path'

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

const docsDirectory = path.join(process.cwd(), 'data')

function exploreDirectory(directory: string) {
    let files: string[] = []
    try {
        const items = fs.readdirSync(directory, { withFileTypes: true })
        for (const item of items) {
            const fullPath = path.join(directory, item.name)

            if (item.isDirectory()) {
                // console.log("Directory:", fullPath);
                files = files.concat(exploreDirectory(fullPath)) // 재귀 호출
            } else if (item.isFile()) {
                // console.log("File:", fullPath);
                files.push(fullPath)
            }
        }
    } catch (error) {
        console.error('Error reading directory:', directory, error)
    }

    return files
}

export function getDocsData() {
    console.log(exploreDirectory(docsDirectory))

    const fileNames = exploreDirectory(docsDirectory)

    const allPostsData: Partial<Metadata>[] = fileNames.map((fileName) => {
        // Remove ".md" from file name to get id
        const id = fileName.replace(/\.mdx?$/, '')

        // Read markdown file as string
        // const fullPath = path.join(docsDirectory, fileName);
        console.log(fileName)
        const fileContents = fs.readFileSync(fileName, 'utf8')
        // Use gray-matter to parse the post metadata section
        const matterResult = matter(fileContents)
        // 프로젝트 루트 기준의 상대경로(확장자 없는)만 추출
        const relPathFromRoot = path
            .relative(process.cwd(), fileName)
            .replace(/\.(mdx|md)$/i, '')
            
        console.log(relPathFromRoot)
        // Combine the data with the id
        // thumbnail 경로를 항상 /로 시작하게, 중복 / 방지, null/undefined 안전하게
        // thumbnail 경로를 public 폴더 기준의 경로로 변환하여 /로 시작하게
        // thumbnail 경로를 public 폴더 기준으로 /로 시작하게 단순화
        let thumbnailPath = matterResult.data.thumbnail
        if (typeof thumbnailPath === 'string' && thumbnailPath.length > 0) {
            thumbnailPath = thumbnailPath.trim()
            // public/이 포함되어 있으면 /public/ 이후만 추출
            const idx = thumbnailPath.indexOf('public/')
            if (idx !== -1) {
                thumbnailPath = thumbnailPath.slice(idx + 'public/'.length)
            }
            // /로 시작하지 않으면 붙임
            if (!thumbnailPath.startsWith('/')) {
                thumbnailPath = '/' + thumbnailPath
            }
        } else {
            thumbnailPath = null
        }
        return {
            id,
            ...matterResult.data,
            content: matterResult.content,
            fileName: relPathFromRoot,
            thumbnail: thumbnailPath,
        }
    })
    console.log(allPostsData)

    return allPostsData
}

export function getSortedPostsData() {
    const allPostsData = getDocsData()
    return allPostsData.sort((a, b) => {
        if (a.date && b.date && a.date < b.date) {
            return 1
        } else {
            return -1
        }
    })
}
