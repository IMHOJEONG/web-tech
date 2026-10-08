import fs from 'fs'
import path from 'path'
import { listMarkdownFiles } from './local-markdown-files'
import { parseLocalDocument } from './local-document-parser'
import type { Metadata } from './document.types'
export type { Metadata } from './document.types'
import {
    categoryTree,
    getCategoryTopic,
} from '~/entities/category/model/category'
import {
    getLocalCategoryDirectory,
    toLocalContentFileName,
} from '~/lib/local-content-paths'

const categoryDirectory = getLocalCategoryDirectory()

export const subCategories = (
    fs.existsSync(categoryDirectory)
        ? fs.readdirSync(categoryDirectory, { withFileTypes: true })
        : []
)
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => path.join(categoryDirectory, dirent.name))

function parseCategoryFile(fileName: string): Partial<Metadata> | null {
    const fileContents = fs.readFileSync(fileName, 'utf8')
    return parseLocalDocument(
        fileName,
        toLocalContentFileName(fileName),
        fileContents
    )
}

function sortDocsByDate(docs: Partial<Metadata>[]) {
    return [...docs].sort((a, b) => {
        const aTime = a.date ? new Date(a.date).getTime() : 0
        const bTime = b.date ? new Date(b.date).getTime() : 0

        return bTime - aTime
    })
}

function getDocsByDirectory(directory: string) {
    const fileNames = listMarkdownFiles(directory)
    return sortDocsByDate(
        fileNames
            .map(parseCategoryFile)
            .filter((doc): doc is Partial<Metadata> => doc !== null)
    )
}

export async function getSubCategoryData(main: string, sub: string) {
    const match = getCategoryTopic(main, sub)

    if (!match) return []

    return getDocsByDirectory(
        path.join(categoryDirectory, match.category.url, match.topic.url)
    )
}

export async function getCategoryData(main: string, sub: string) {
    return getSubCategoryData(main, sub)
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
