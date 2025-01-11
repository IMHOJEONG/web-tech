import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface Metadata {
    id: string
    title: string
    date: string
    summary: string
    slug: string
    content: string
}

const docsDirectory = path.join(process.cwd(), 'docs')
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

        // Combine the data with the id
        return {
            id,
            ...matterResult.data,
            content: matterResult.content,
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
