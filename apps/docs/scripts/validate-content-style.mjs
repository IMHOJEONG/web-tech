import fs from 'fs/promises'
import path from 'path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'url'
import {
    collectMarkdownFiles,
    normalizeStatus,
    parseFrontmatter,
} from './validate-content.mjs'

const DOCS_ROOT = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..'
)
const CONTENT_DIRECTORIES = ['data', 'category'].map((directory) =>
    path.join(DOCS_ROOT, directory)
)
const CODE_FENCE_PATTERN = /^```(\S*)\s*$/
const HEADING_PATTERN = /^(#{1,6})\s+(.+?)\s*$/
const CALLOUT_MARKER_PATTERN = /\[!([A-Za-z][A-Za-z0-9_-]*)\]/
const CALLOUT_BLOCKQUOTE_PATTERN = /^\s*>\s*\[!([A-Za-z][A-Za-z0-9_-]*)\]/
const SUPPORTED_CALLOUT_MARKERS = new Set(['NOTE', 'TIP', 'WARNING'])
const PLACEHOLDER_PATTERN = /\b(TODO|FIXME|lorem ipsum)\b|임시|테스트용/i
const PLACEHOLDER_SLUGS = new Set(['test', 'sample', 'todo', 'draft'])

function getBody(source) {
    if (!source.startsWith('---')) {
        return source
    }

    const lines = source.split(/\r?\n/)
    const closingIndex = lines.findIndex(
        (line, index) => index > 0 && line.trim() === '---'
    )

    if (closingIndex === -1) {
        return source
    }

    return lines.slice(closingIndex + 1).join('\n')
}

async function collectNonMarkdownFiles(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true })
    const files = []

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name)

        if (entry.isDirectory()) {
            files.push(...(await collectNonMarkdownFiles(fullPath)))
            continue
        }

        if (entry.isFile() && !/\.(md|mdx)$/i.test(entry.name)) {
            files.push(fullPath)
        }
    }

    return files
}

export function getContentStyleIssues(source, frontmatter = {}) {
    const failures = []
    const warnings = []
    const body = getBody(source)
    const lines = body.split(/\r?\n/)
    const status = normalizeStatus(frontmatter.status)
    const isPublished = status === 'published'
    const trimmedBody = body.trim()
    const headings = []
    let isInsideCodeFence = false

    if (!trimmedBody) {
        if (isPublished) {
            warnings.push('published content should include body content')
        }

        return { failures, warnings }
    }

    for (const [index, line] of lines.entries()) {
        const codeFenceMatch = line.match(CODE_FENCE_PATTERN)

        if (codeFenceMatch) {
            if (!isInsideCodeFence && !codeFenceMatch[1]) {
                failures.push(
                    `line ${index + 1}: code block language is required`
                )
            }

            isInsideCodeFence = !isInsideCodeFence
            continue
        }

        if (isInsideCodeFence) {
            continue
        }

        const calloutMarkerMatch = line.match(CALLOUT_MARKER_PATTERN)
        const calloutBlockquoteMatch = line.match(CALLOUT_BLOCKQUOTE_PATTERN)

        if (calloutMarkerMatch) {
            const marker = calloutMarkerMatch[1].toUpperCase()

            if (!calloutBlockquoteMatch) {
                failures.push(
                    `line ${index + 1}: callout marker should be the first text in a blockquote`
                )
            } else if (!SUPPORTED_CALLOUT_MARKERS.has(marker)) {
                failures.push(
                    `line ${index + 1}: unsupported callout marker [!${marker}]`
                )
            }
        }

        const headingMatch = line.match(HEADING_PATTERN)

        if (!headingMatch) {
            continue
        }

        const level = headingMatch[1].length

        headings.push({ level, line: index + 1 })

        if (level === 1) {
            failures.push(
                `line ${index + 1}: h1 is reserved for frontmatter title`
            )
        }
    }

    if (isInsideCodeFence) {
        failures.push('code block is not closed')
    }

    if (headings.length === 0) {
        if (isPublished) {
            warnings.push(
                'published content should include at least one heading'
            )
        }
    } else if (headings[0].level !== 2 && headings[0].level !== 3) {
        failures.push('first heading should start at h2 or h3')
    }

    for (let index = 1; index < headings.length; index += 1) {
        const previousHeading = headings[index - 1]
        const currentHeading = headings[index]

        if (currentHeading.level - previousHeading.level > 1) {
            failures.push(
                `line ${currentHeading.line}: heading level jumps from h${previousHeading.level} to h${currentHeading.level}`
            )
        }
    }

    if (isPublished && PLACEHOLDER_PATTERN.test(body)) {
        warnings.push('published content contains placeholder-like text')
    }

    if (
        isPublished &&
        PLACEHOLDER_SLUGS.has(String(frontmatter.slug ?? '').trim())
    ) {
        warnings.push('published content uses a placeholder-like slug')
    }

    return { failures, warnings }
}

export async function main() {
    const [markdownFiles, nonMarkdownFiles] = await Promise.all([
        Promise.all(CONTENT_DIRECTORIES.map(collectMarkdownFiles)).then(
            (files) => files.flat()
        ),
        Promise.all(CONTENT_DIRECTORIES.map(collectNonMarkdownFiles)).then(
            (files) => files.flat()
        ),
    ])
    const failures = nonMarkdownFiles.map(
        (filePath) =>
            `${filePath}: non-markdown files are not allowed in content directories`
    )
    const warnings = []

    for (const filePath of markdownFiles) {
        const source = await fs.readFile(filePath, 'utf8')
        const frontmatter = parseFrontmatter(source) ?? {}
        const issues = getContentStyleIssues(source, frontmatter)

        failures.push(
            ...issues.failures.map((issue) => `${filePath}: ${issue}`)
        )
        warnings.push(
            ...issues.warnings.map((issue) => `${filePath}: ${issue}`)
        )
    }

    if (warnings.length > 0) {
        console.warn('[docs] Content style validation warnings.\n')
        for (const warning of warnings) {
            console.warn(`- ${warning}`)
        }
        console.warn('')
    }

    if (failures.length > 0) {
        console.error('[docs] Content style validation failed.\n')
        for (const failure of failures) {
            console.error(`- ${failure}`)
        }
        process.exit(1)
    }

    console.log(
        `[docs] Content style validation passed for ${markdownFiles.length} files.`
    )
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    await main()
}
