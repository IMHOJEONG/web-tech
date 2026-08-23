import fs from 'fs'
import path from 'path'

function hasLocalContentDirectory(root: string) {
    return (
        fs.existsSync(path.join(root, 'data')) ||
        fs.existsSync(path.join(root, 'category'))
    )
}

export function resolveLocalContentRoot(cwd = process.cwd()) {
    const candidates = [cwd, path.join(cwd, 'apps/docs')]

    return (
        candidates.find((candidate) => hasLocalContentDirectory(candidate)) ??
        cwd
    )
}

export function getLocalDataDirectory() {
    return path.join(resolveLocalContentRoot(), 'data')
}

export function getLocalCategoryDirectory() {
    return path.join(resolveLocalContentRoot(), 'category')
}

export function toLocalContentFileName(filePath: string) {
    return path
        .relative(resolveLocalContentRoot(), filePath)
        .replace(/\.(mdx|md)$/i, '')
}
