declare module 'vfile' {
    interface DataMap {
        matter: import('~/lib/editorial-metadata').LocalDocFrontmatterInput
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
import {
    assertValidLocalDocFrontmatter,
    isPublicDocStatus,
    normalizeLocalDocFrontmatter,
    type EditorialStatus,
} from '~/lib/editorial-metadata'
import { getDocHref, isDocRouteMatch } from '~/lib/get-doc-route'
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
    updatedAt?: string
    authorName?: string
    authorRole?: string
    readMinutes?: number
    topicLabel?: string
    tags?: string[]
    status?: EditorialStatus
}

function resolveDocsDirectory() {
    const fallbackDirectory = path.join(process.cwd(), 'data')
    const candidates = [
        fallbackDirectory,
        path.join(process.cwd(), 'apps/docs/data'),
    ]

    return (
        candidates.find((candidate) => fs.existsSync(candidate)) ??
        fallbackDirectory
    )
}

const docsDirectory = resolveDocsDirectory()
const docsRootDirectory = path.dirname(docsDirectory)

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

    const allPostsData: Partial<Metadata>[] = fileNames.flatMap((fileName) => {
        // Read markdown file as string
        const fileContents = fs.readFileSync(fileName, 'utf8')
        // Use vfile-matter to parse the post metadata section
        const vfile = new VFile({ path: fileName, value: fileContents })
        vfileMatter(vfile, { strip: true })
        const frontmatter = normalizeLocalDocFrontmatter(
            vfile.data.matter || {}
        )
        assertValidLocalDocFrontmatter(fileName, frontmatter)

        if (!isPublicDocStatus(frontmatter.status)) {
            return []
        }

        const content = String(vfile)
        // 프로젝트 루트 기준의 상대경로(확장자 없는)만 추출
        const relPathFromRoot = path
            .relative(docsRootDirectory, fileName)
            .replace(/\.(mdx|md)$/i, '')
        const normalizedFileName = normalizeDocPath(relPathFromRoot)
        const fallbackSlug =
            normalizedFileName.split('/').filter(Boolean).pop() ?? ''

        // thumbnail 경로를 public 폴더 기준으로 /로 시작하게 단순화
        let thumbnailPath = frontmatter.thumbnail
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
        return [
            {
                id: frontmatter.id ?? normalizedFileName,
                title: frontmatter.title ?? fallbackSlug,
                slug: frontmatter.slug ?? fallbackSlug,
                summary: frontmatter.summary ?? '',
                date: frontmatter.date ?? '',
                content,
                fileName: normalizedFileName,
                contentFormat: 'mdx',
                contentSource: 'local',
                thumbnail: thumbnailPath,
                updatedAt: frontmatter.updatedAt,
                authorName: frontmatter.authorName,
                authorRole: frontmatter.authorRole,
                readMinutes: frontmatter.readMinutes,
                topicLabel: frontmatter.topicLabel,
                tags: frontmatter.tags,
                status: frontmatter.status,
            },
        ]
    })

    return allPostsData
}

function getDocIdentityKey(doc: Partial<Metadata>) {
    const href = getDocHref({
        slug: doc.slug,
        markdownPath: doc.markdownPath,
        fileName: doc.fileName,
    })

    if (href !== '/docs') {
        return href
    }

    return String(doc.id ?? doc.markdownPath ?? doc.fileName ?? doc.slug ?? '')
}

function mergeDocsData(
    localDocs: Partial<Metadata>[],
    remoteDocs: Partial<Metadata>[]
) {
    const seenKeys = new Set<string>()
    const mergedDocs: Partial<Metadata>[] = []

    for (const doc of [...remoteDocs, ...localDocs]) {
        const key = getDocIdentityKey(doc)

        if (key && seenKeys.has(key)) {
            continue
        }

        if (key) {
            seenKeys.add(key)
        }

        mergedDocs.push(doc)
    }

    return mergedDocs
}

async function fetchRemoteDocsDataSafely() {
    try {
        return (await fetchRemoteDocsData()) ?? []
    } catch (error) {
        console.warn(
            '[docs] Remote document index unavailable. Rendering local docs only.',
            error
        )
        return []
    }
}

export async function getDocsData() {
    const [localDocs, remoteDocs] = await Promise.all([
        Promise.resolve(getLocalDocsData()),
        fetchRemoteDocsDataSafely(),
    ])

    return mergeDocsData(localDocs, remoteDocs)
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
    const localDoc = getLocalDocsData().find((doc) =>
        isDocRouteMatch(doc, routePath)
    )

    if (localDoc) {
        return localDoc
    }

    let remoteDoc: Partial<Metadata> | null = null

    try {
        remoteDoc = await fetchRemoteDocByRoutePath(routePath)
    } catch (error) {
        console.warn(
            '[docs] Remote document detail unavailable. Trying local document fallback.',
            routePath,
            error
        )
    }

    if (remoteDoc) {
        return remoteDoc
    }
    return null
}
