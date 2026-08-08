import fg from 'fast-glob'
import fs from 'fs'
import path from 'path'
import { VFile } from 'vfile'
import { matter as vfileMatter } from 'vfile-matter'
import { categoryTree } from '~/entities/category/model/category'
import {
    normalizeLocalDocFrontmatter,
    type EditorialStatus,
} from '~/lib/editorial-metadata'
import { normalizeDocPath } from '~/lib/normalize-doc-path'

export interface Metadata {
    id: string
    title: string
    date: string
    summary: string
    slug: string
    content: string
    fileName: string
    thumbnail?: string | null
    updatedAt?: string
    authorName?: string
    authorRole?: string
    readMinutes?: number
    topicLabel?: string
    tags?: string[]
    status?: EditorialStatus
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

function normalizeThumbnailPath(thumbnail?: unknown) {
    if (typeof thumbnail !== 'string') {
        return null
    }

    const trimmed = thumbnail.trim()

    if (!trimmed) {
        return null
    }

    let thumbnailPath = trimmed
    const idx = thumbnailPath.indexOf('public/')

    if (idx !== -1) {
        thumbnailPath = thumbnailPath.slice(idx + 'public/'.length)
    }

    if (!thumbnailPath.startsWith('/')) {
        thumbnailPath = `/${thumbnailPath}`
    }

    return thumbnailPath
}

function parseCategoryFile(fileName: string): Partial<Metadata> {
    const fileContents = fs.readFileSync(fileName, 'utf8')
    const vfile = new VFile({ path: fileName, value: fileContents })
    vfileMatter(vfile, { strip: true })
    const frontmatter = normalizeLocalDocFrontmatter(vfile.data.matter || {})
    const content = String(vfile)
    const relPathFromRoot = path
        .relative(process.cwd(), fileName)
        .replace(/\.(mdx|md)$/i, '')
    const normalizedFileName = normalizeDocPath(relPathFromRoot)
    const fallbackSlug = normalizedFileName.split('/').filter(Boolean).pop() ?? ''

    return {
        id: frontmatter.id ?? normalizedFileName,
        title: frontmatter.title ?? fallbackSlug,
        slug: frontmatter.slug ?? fallbackSlug,
        summary: frontmatter.summary ?? '',
        date: frontmatter.date ?? '',
        content,
        fileName: normalizedFileName,
        thumbnail: normalizeThumbnailPath(frontmatter.thumbnail),
        updatedAt: frontmatter.updatedAt,
        authorName: frontmatter.authorName,
        authorRole: frontmatter.authorRole,
        readMinutes: frontmatter.readMinutes,
        topicLabel: frontmatter.topicLabel,
        tags: frontmatter.tags,
        status: frontmatter.status,
    }
}

function sortDocsByDate(docs: Partial<Metadata>[]) {
    return [...docs].sort((a, b) => {
        const aTime = a.date ? new Date(a.date).getTime() : 0
        const bTime = b.date ? new Date(b.date).getTime() : 0

        return bTime - aTime
    })
}

async function getDocsByPattern(pattern: string) {
    const fileNames = await exploreDirectory(pattern)
    return sortDocsByDate(fileNames.map(parseCategoryFile))
}

export async function getSubCategoryData(main: string, sub: string) {
    return getDocsByPattern(`category/${main}/${sub}/*.{md,mdx}`)
}

export async function getCategoryData(main: string, sub: string) {
    return getDocsByPattern(`category/${main}/${sub}/*.{md,mdx}`)
}

export async function getMainCategoryOverview() {
    return Promise.all(
        categoryTree.map(async (category) => {
            const subDocs = await Promise.all(
                category.sub.map((topic) =>
                    getSubCategoryData(category.url, topic.url)
                )
            )

            const docs = sortDocsByDate(subDocs.flat())

            return {
                title: category.title,
                url: category.url,
                docCount: docs.length,
                subCount: category.sub.length,
                latestTitle: docs[0]?.title ?? null,
                latestDate: docs[0]?.date ?? null,
            }
        })
    )
}

export async function getSubCategoryOverview(main: string) {
    const category = categoryTree.find((item) => item.url === main)

    if (!category) {
        return []
    }

    return Promise.all(
        category.sub.map(async (topic) => {
            const docs = await getSubCategoryData(main, topic.url)

            return {
                title: topic.title,
                url: topic.url,
                docCount: docs.length,
                latestTitle: docs[0]?.title ?? null,
                latestDate: docs[0]?.date ?? null,
            }
        })
    )
}
