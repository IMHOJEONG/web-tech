declare module 'vfile' {
    interface DataMap {
        matter: {
            title?: string | undefined
            slug?: string | undefined
            date?: string | undefined
            summary?: string | undefined
            thumbnail?: string | null
            author?: string | undefined
            authorName?: string | undefined
            authorRole?: string | undefined
            role?: string | undefined
            readMinutes?: number | string | undefined
            readTime?: number | string | undefined
            topicLabel?: string | undefined
            topic?: string | undefined
            use?: Record<string, unknown>
        }
    }
}
import fs from 'fs'
import path from 'path'
import { VFile } from 'vfile'
import { matter as vfileMatter } from 'vfile-matter'
import {
    fetchRemoteDocByRoutePath,
    fetchRemoteDocsData,
} from '~/lib/content-api'
import { isDocRouteMatch } from '~/lib/get-doc-route'
import { normalizeDocPath } from '~/lib/normalize-doc-path'

export type ContentFormat = 'mdx' | 'html'
export type ContentSource = 'local' | 'remote'

export interface Metadata {
    id: string
    title: string
    date: string
    summary: string
    slug: string
    content: string
    fileName: string
    contentFormat?: ContentFormat
    contentSource?: ContentSource
    markdownPath?: string | null
    thumbnail?: string | null
    authorName?: string
    authorRole?: string
    readMinutes?: number
    topicLabel?: string
}

const docsDirectory = path.join(process.cwd(), 'data')

function normalizeReadMinutes(value?: unknown) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        return Math.round(value)
    }

    if (typeof value === 'string') {
        const parsedValue = Number.parseInt(value.trim(), 10)

        if (Number.isFinite(parsedValue) && parsedValue > 0) {
            return parsedValue
        }
    }

    return undefined
}

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

function getLocalDocsData() {
    const fileNames = exploreDirectory(docsDirectory)

    const allPostsData: Partial<Metadata>[] = fileNames.map((fileName) => {
        // Remove ".md" from file name to get id
        const id = fileName.replace(/\.mdx?$/, '')

        // Read markdown file as string
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
        const normalizedFileName = normalizeDocPath(relPathFromRoot)

        // thumbnail 경로를 public 폴더 기준으로 /로 시작하게 단순화
        let thumbnailPath = data.thumbnail
        if (typeof thumbnailPath === 'string' && thumbnailPath.length > 0) {
            thumbnailPath = thumbnailPath.trim()
            const idx = thumbnailPath.indexOf('public/')
            if (idx !== -1) {
                thumbnailPath = thumbnailPath.slice(idx + 'public/'.length)
            }
            if (!thumbnailPath.startsWith('/')) {
                thumbnailPath = '/' + thumbnailPath
            }
        } else {
            thumbnailPath = null
        }
        return {
            id,
            ...data,
            content,
            fileName: normalizedFileName,
            contentFormat: 'mdx',
            contentSource: 'local',
            thumbnail: thumbnailPath,
            authorName: data.authorName ?? data.author,
            authorRole: data.authorRole ?? data.role,
            readMinutes: normalizeReadMinutes(
                data.readMinutes ?? data.readTime
            ),
            topicLabel: data.topicLabel ?? data.topic,
        }
    })

    return allPostsData
}

export async function getDocsData() {
    const remoteDocs = await fetchRemoteDocsData()

    if (remoteDocs) {
        return remoteDocs
    }

    return getLocalDocsData()
}

export async function getSortedPostsData() {
    const allPostsData = await getDocsData()
    return allPostsData.sort((a, b) => {
        if (a.date && b.date && a.date < b.date) {
            return 1
        } else {
            return -1
        }
    })
}

export async function getDocByRoutePath(routePath: string) {
    const remoteDoc = await fetchRemoteDocByRoutePath(routePath)

    if (remoteDoc) {
        return remoteDoc
    }

    return getLocalDocsData().find((doc) => isDocRouteMatch(doc, routePath))
}
