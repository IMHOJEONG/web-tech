import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { listLocalMarkdownFiles } from './local-markdown-files.ts'

// Runs when Next config is loaded, not on each search request.
export function getLocalSearchRevision(root: string) {
    const hash = createHash('sha256')
    for (const file of listLocalMarkdownFiles(root)) {
        const body = readFileSync(file)
        const relative = path.relative(root, file).split(path.sep).join('/')
        hash.update(JSON.stringify([relative, body.length]))
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
