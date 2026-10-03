import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import fg from 'fast-glob'

export const LOCAL_SEARCH_PATTERNS = [
    'data/**/*.{md,mdx}',
    'category/**/*.{md,mdx}',
]

// Runs when Next config is loaded, not on each search request.
export function getLocalSearchRevision(root: string) {
    const hash = createHash('sha256')
    for (const file of fg.sync(LOCAL_SEARCH_PATTERNS, { cwd: root }).sort()) {
        const body = readFileSync(path.join(root, file))
        hash.update(JSON.stringify([file, body.length]))
        hash.update(body)
    }
    return hash.digest('hex')
}

export function shouldCacheLocalSearchIndex(
    environment?: string,
    revision?: string
) {
    return environment === 'production' && Boolean(revision)
}
