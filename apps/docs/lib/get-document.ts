import fs from 'fs'
import path from 'path'
import { cache } from 'react'
import { parseLocalDocument } from './local-document-parser'
import type { Metadata } from './document.types'
export type { Metadata, ContentFormat, ContentSource } from './document.types'
import {
    fetchRemoteDocByRoutePath,
    fetchRemoteDocsData,
} from '~/lib/content-api'
import { shouldIncludeRemoteContentIndex } from '~/lib/content-api-config'
import {
    logContentSource,
    resolveCollectionContentSource,
} from '~/lib/content-source-log'
import { selectDocumentBySourcePolicy } from '~/lib/content-source-policy'
import { getDocHref, isDocRouteMatch } from '~/lib/get-doc-route'
import {
    getLocalContentDirectories,
    toLocalContentFileName,
} from '~/lib/local-content-paths'

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

const readLocalDocsSnapshot = cache(function readLocalDocsSnapshot() {
    const fileNames = getLocalContentDirectories().flatMap(exploreDirectory)

    const allPostsData: Partial<Metadata>[] = fileNames.flatMap((fileName) => {
        const fileContents = fs.readFileSync(fileName, 'utf8')
        const doc = parseLocalDocument(
            fileName,
            toLocalContentFileName(fileName),
            fileContents
        )
        return doc ? [doc] : []
    })

    return Object.freeze(allPostsData)
})

export function getLocalDocsData() {
    // Share file reads only within a React server render; keep caller sorting isolated.
    return [...readLocalDocsSnapshot()]
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

type RemoteDocsDataResult = {
    docs: Partial<Metadata>[]
    status: 'available' | 'failed'
}

async function fetchRemoteDocsDataSafely(): Promise<RemoteDocsDataResult> {
    try {
        return {
            docs: (await fetchRemoteDocsData()) ?? [],
            status: 'available',
        }
    } catch (error) {
        console.warn(
            '[docs] Remote document index unavailable. Rendering local docs only.',
            error
        )
        return {
            docs: [],
            status: 'failed',
        }
    }
}

type DocsDataOptions = {
    includeRemote?: boolean
}

export async function getDocsData(options: DocsDataOptions = {}) {
    const localDocs = getLocalDocsData()
    const includeRemote =
        options.includeRemote ?? shouldIncludeRemoteContentIndex()

    if (!includeRemote) {
        logContentSource({
            area: 'index',
            source: resolveCollectionContentSource(localDocs.length, 0),
            reason: 'remote-index-disabled',
            includeRemote,
            localCount: localDocs.length,
            remoteCount: 0,
            totalCount: localDocs.length,
        })

        return localDocs
    }

    const remoteResult = await fetchRemoteDocsDataSafely()
    const remoteDocs = remoteResult.docs
    const mergedDocs = mergeDocsData(localDocs, remoteDocs)

    logContentSource({
        area: 'index',
        source: resolveCollectionContentSource(
            localDocs.length,
            remoteDocs.length
        ),
        reason:
            remoteResult.status === 'failed'
                ? 'remote-index-failed-local-fallback'
                : 'remote-index-enabled',
        includeRemote,
        localCount: localDocs.length,
        remoteCount: remoteDocs.length,
        totalCount: mergedDocs.length,
    })

    return mergedDocs
}

export async function getSortedPostsData(options: DocsDataOptions = {}) {
    const allPostsData = await getDocsData(options)
    return [...allPostsData].sort((a, b) => {
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
    const includeRemote = shouldIncludeRemoteContentIndex()

    if (includeRemote) {
        try {
            const remoteDoc = await fetchRemoteDocByRoutePath(routePath)

            if (remoteDoc) {
                logContentSource({
                    area: 'detail',
                    source: 'remote',
                    reason: 'remote-detail-found',
                    routePath,
                    includeRemote,
                })

                return remoteDoc
            }
        } catch (error) {
            console.warn(
                '[docs] Remote document detail unavailable. Trying local document fallback.',
                routePath,
                error
            )
        }

        const selectedDoc = selectDocumentBySourcePolicy({
            includeRemote,
            localDoc,
            remoteDoc: null,
        })

        logContentSource({
            area: 'detail',
            source: selectedDoc ? 'local' : 'none',
            reason: selectedDoc
                ? 'remote-detail-unavailable-local-fallback'
                : 'remote-detail-unavailable-no-local-fallback',
            routePath,
            includeRemote,
        })

        return selectedDoc
    }

    if (localDoc) {
        logContentSource({
            area: 'detail',
            source: 'local',
            reason: 'remote-index-disabled-local-first',
            routePath,
            includeRemote,
        })

        return selectDocumentBySourcePolicy({
            includeRemote,
            localDoc,
            remoteDoc: null,
        })
    }

    try {
        const selectedDoc = selectDocumentBySourcePolicy({
            includeRemote,
            localDoc,
            remoteDoc: await fetchRemoteDocByRoutePath(routePath),
        })

        logContentSource({
            area: 'detail',
            source: selectedDoc ? 'remote' : 'none',
            reason: selectedDoc
                ? 'local-missing-remote-fallback'
                : 'local-and-remote-missing',
            routePath,
            includeRemote,
        })

        return selectedDoc
    } catch (error) {
        console.warn(
            '[docs] Remote document detail unavailable.',
            routePath,
            error
        )
    }

    logContentSource({
        area: 'detail',
        source: 'none',
        reason: 'local-and-remote-unavailable',
        routePath,
        includeRemote,
    })

    return null
}
