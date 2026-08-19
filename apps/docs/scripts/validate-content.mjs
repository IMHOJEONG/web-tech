import fs from 'fs/promises'
import path from 'path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'url'

const LEAF_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const NON_PUBLIC_STATUSES = new Set(['draft', 'archived'])
const DOCS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CONTENT_DIRECTORIES = ['data', 'category'].map((directory) =>
    path.join(DOCS_ROOT, directory)
)

export function normalizeOptionalString(value) {
    if (typeof value !== 'string') {
        return undefined
    }

    const trimmedValue = value.trim()

    return trimmedValue || undefined
}

export function parseScalar(rawValue) {
    const trimmedValue = rawValue.trim()

    if (!trimmedValue) {
        return ''
    }

    if (
        (trimmedValue.startsWith("'") && trimmedValue.endsWith("'")) ||
        (trimmedValue.startsWith('"') && trimmedValue.endsWith('"'))
    ) {
        return trimmedValue.slice(1, -1)
    }

    if (/^\d+$/.test(trimmedValue)) {
        return Number(trimmedValue)
    }

    return trimmedValue
}

export function parseFrontmatter(source) {
    if (!source.startsWith('---')) {
        return null
    }

    const lines = source.split(/\r?\n/)

    if (lines[0].trim() !== '---') {
        return null
    }

    const closingIndex = lines.findIndex(
        (line, index) => index > 0 && line.trim() === '---'
    )

    if (closingIndex === -1) {
        return null
    }

    const frontmatterLines = lines.slice(1, closingIndex)
    const data = {}

    for (let index = 0; index < frontmatterLines.length; index += 1) {
        const rawLine = frontmatterLines[index]
        const trimmedLine = rawLine.trim()

        if (!trimmedLine || trimmedLine.startsWith('#')) {
            continue
        }

        const keyMatch = rawLine.match(/^([A-Za-z0-9_]+):(?:\s*(.*))?$/)

        if (!keyMatch) {
            continue
        }

        const [, key, rawValue = ''] = keyMatch

        if (!rawValue.trim()) {
            const items = []
            let lookaheadIndex = index + 1

            while (lookaheadIndex < frontmatterLines.length) {
                const lookaheadLine = frontmatterLines[lookaheadIndex]
                const itemMatch = lookaheadLine.match(/^\s*-\s+(.*)$/)

                if (!itemMatch) {
                    break
                }

                items.push(parseScalar(itemMatch[1]))
                lookaheadIndex += 1
            }

            if (items.length > 0) {
                data[key] = items
                index = lookaheadIndex - 1
                continue
            }
        }

        data[key] = parseScalar(rawValue)
    }

    return data
}

export async function collectMarkdownFiles(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true })
    const files = []

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name)

        if (entry.isDirectory()) {
            files.push(...(await collectMarkdownFiles(fullPath)))
            continue
        }

        if (entry.isFile() && /\.(md|mdx)$/i.test(entry.name)) {
            files.push(fullPath)
        }
    }

    return files
}

export function isValidDateString(value) {
    return typeof value === 'string' && value.trim() && Number.isFinite(Date.parse(value))
}

export function normalizeStatus(value) {
    const normalizedValue = normalizeOptionalString(value)?.toLowerCase()

    if (!normalizedValue) {
        return undefined
    }

    if (
        normalizedValue === 'draft' ||
        normalizedValue === 'published' ||
        normalizedValue === 'archived'
    ) {
        return normalizedValue
    }

    return '__invalid__'
}

export function isPositiveInteger(value) {
    return Number.isInteger(value) && value > 0
}

export function getFrontmatterIssues(frontmatter) {
    const issues = []
    const status = normalizeStatus(frontmatter.status)
    const isNonPublic = status && NON_PUBLIC_STATUSES.has(status)
    const title = normalizeOptionalString(frontmatter.title)
    const slug = normalizeOptionalString(frontmatter.slug)
    const summary = normalizeOptionalString(frontmatter.summary)
    const authorName = normalizeOptionalString(frontmatter.authorName)
    const authorRole = normalizeOptionalString(frontmatter.authorRole)
    const topicLabel = normalizeOptionalString(frontmatter.topicLabel)
    const date = frontmatter.date
    const updatedAt = frontmatter.updatedAt
    const readMinutes = frontmatter.readMinutes

    if (frontmatter.status == null || frontmatter.status === '') {
        issues.push('status is required')
    } else if (status === '__invalid__') {
        issues.push('status must be draft, published, or archived')
    }

    if (!title) {
        issues.push('title is required')
    }

    if (!slug) {
        issues.push('slug is required')
    } else if (!LEAF_SLUG_PATTERN.test(slug)) {
        issues.push('slug must be lowercase kebab-case')
    }

    if (!isNonPublic) {
        if (!summary) {
            issues.push('summary is required for published content')
        }

        if (
            typeof date !== 'string' &&
            typeof date !== 'number'
        ) {
            issues.push('date is required for published content')
        } else if (!isValidDateString(String(date))) {
            issues.push('date must be a valid date string')
        }
    } else if (date != null && !isValidDateString(String(date))) {
        issues.push('date must be a valid date string when provided')
    }

    if (updatedAt != null && !isValidDateString(String(updatedAt))) {
        issues.push('updatedAt must be a valid date string when provided')
    }

    if (readMinutes != null && !isPositiveInteger(readMinutes)) {
        issues.push('readMinutes must be a positive integer when provided')
    }

    if (!isNonPublic) {
        if (!updatedAt) {
            issues.push('updatedAt is required for published content')
        }

        if (!authorName) {
            issues.push('authorName is required for published content')
        }

        if (!authorRole) {
            issues.push('authorRole is required for published content')
        }

        if (readMinutes == null) {
            issues.push('readMinutes is required for published content')
        }

        if (!topicLabel) {
            issues.push('topicLabel is required for published content')
        }
    }

    return issues
}

export async function main() {
    const files = (
        await Promise.all(CONTENT_DIRECTORIES.map(collectMarkdownFiles))
    ).flat()

    const failures = []

    for (const filePath of files) {
        const source = await fs.readFile(filePath, 'utf8')

        const frontmatter = parseFrontmatter(source)

        if (!frontmatter) {
            failures.push(`${filePath}: frontmatter block is required`)
            continue
        }

        const issues = getFrontmatterIssues(frontmatter)

        if (issues.length > 0) {
            failures.push(`${filePath}: ${issues.join('; ')}`)
        }
    }

    if (failures.length > 0) {
        console.error('[docs] Content frontmatter validation failed.\n')
        for (const failure of failures) {
            console.error(`- ${failure}`)
        }
        process.exit(1)
    }

    console.log(`[docs] Content frontmatter validation passed for ${files.length} files.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await main()
}
