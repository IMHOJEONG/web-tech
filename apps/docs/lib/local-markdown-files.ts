import { lstatSync, readdirSync } from 'node:fs'
import path from 'node:path'

function missing(error: unknown) {
    return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}

export function listMarkdownFiles(directory: string, recursive = false) {
    const files: string[] = []
    const pending = [path.resolve(directory)]
    // Iterative traversal avoids both glob parsing and recursive stack growth.
    while (pending.length) {
        const current = pending.pop()!
        try {
            if (!lstatSync(current).isDirectory()) continue
            for (const entry of readdirSync(current, { withFileTypes: true })) {
                if (entry.name.startsWith('.')) continue
                const file = path.join(current, entry.name)
                if (recursive && entry.isDirectory()) pending.push(file)
                else if (
                    entry.isFile() &&
                    (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))
                )
                    files.push(file)
            }
        } catch (error) {
            if (!missing(error)) throw error
        }
    }
    return files.sort()
}

export function listLocalMarkdownFiles(root: string) {
    return ['data', 'category']
        .flatMap((directory) =>
            listMarkdownFiles(path.join(root, directory), true)
        )
        .sort()
}
