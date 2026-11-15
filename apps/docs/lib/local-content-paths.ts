import fs from 'fs'
import path from 'path'

function hasLocalContentDirectory(root: string) {
    return (
        fs.existsSync(path.join(root, 'data')) ||
        fs.existsSync(path.join(root, 'category'))
    )
}

export function getPrivateContentRoot(root: string, revision: string) {
    if (!/^[a-f0-9]{40}$/.test(revision))
        throw new Error('Invalid content revision')

    return path.join(root, '.private-content', revision)
}

export function resolveLocalContentRoot(
    cwd = process.cwd(),
    revision = process.env.DOCS_PRIVATE_CONTENT_REVISION
) {
    const candidates = [cwd, path.join(cwd, 'apps/docs')]

    if (revision) {
        const contentRoot = candidates
            .map((candidate) => getPrivateContentRoot(candidate, revision))
            .find(hasLocalContentDirectory)
        if (!contentRoot)
            throw new Error(`Prepared content is missing for ${revision}`)
        return contentRoot
    }

    return candidates.find(hasLocalContentDirectory) ?? cwd
}

export function getLocalDataDirectory() {
    return path.join(resolveLocalContentRoot(), 'data')
}

export function getLocalCategoryDirectory() {
    return path.join(resolveLocalContentRoot(), 'category')
}

export function getLocalContentDirectories(cwd = process.cwd()) {
    const root = resolveLocalContentRoot(cwd)

    return [path.join(root, 'data'), path.join(root, 'category')]
}

export function toLocalContentFileName(filePath: string) {
    return path
        .relative(resolveLocalContentRoot(), filePath)
        .replace(/\.(mdx|md)$/i, '')
}
