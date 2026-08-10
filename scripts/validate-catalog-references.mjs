import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const WORKSPACE_FILE = path.join(ROOT_DIR, 'pnpm-workspace.yaml')
const ROOT_PACKAGE_JSON = path.join(ROOT_DIR, 'package.json')
const DEPENDENCY_SECTIONS = [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies',
]

function normalizeQuotedValue(value) {
    const trimmed = value.trim()

    if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        return trimmed.slice(1, -1)
    }

    return trimmed
}

export function parseWorkspaceCatalogConfig(source) {
    const lines = source.split(/\r?\n/)
    const packages = []
    const rootCatalog = new Map()
    const namedCatalogs = new Map()

    let section = null
    let activeNamedCatalog = null

    for (const rawLine of lines) {
        const lineWithoutComment = rawLine.replace(/\s+#.*$/, '')
        const trimmed = lineWithoutComment.trim()

        if (!trimmed) {
            continue
        }

        if (/^[A-Za-z0-9_-]+:\s*$/.test(lineWithoutComment)) {
            section = lineWithoutComment.slice(0, -1).trim()
            activeNamedCatalog = null
            continue
        }

        if (section === 'packages') {
            const packageMatch = lineWithoutComment.match(/^\s*-\s+(.+?)\s*$/)

            if (packageMatch) {
                packages.push(normalizeQuotedValue(packageMatch[1]))
            }

            continue
        }

        if (section === 'catalog') {
            const catalogMatch = lineWithoutComment.match(
                /^\s{2}(['"]?[^:'"]+['"]?):\s+(.+?)\s*$/
            )

            if (catalogMatch) {
                rootCatalog.set(
                    normalizeQuotedValue(catalogMatch[1]),
                    normalizeQuotedValue(catalogMatch[2])
                )
            }

            continue
        }

        if (section === 'catalogs') {
            const catalogGroupMatch = lineWithoutComment.match(
                /^\s{2}(['"]?[^:'"]+['"]?):\s*$/
            )

            if (catalogGroupMatch) {
                activeNamedCatalog = normalizeQuotedValue(catalogGroupMatch[1])
                namedCatalogs.set(activeNamedCatalog, new Map())
                continue
            }

            const catalogEntryMatch = lineWithoutComment.match(
                /^\s{4}(['"]?[^:'"]+['"]?):\s+(.+?)\s*$/
            )

            if (catalogEntryMatch && activeNamedCatalog) {
                namedCatalogs
                    .get(activeNamedCatalog)
                    ?.set(
                        normalizeQuotedValue(catalogEntryMatch[1]),
                        normalizeQuotedValue(catalogEntryMatch[2])
                    )
            }
        }
    }

    return {
        packages,
        catalog: rootCatalog,
        catalogs: namedCatalogs,
    }
}

export async function resolveWorkspacePackageJsonPaths(rootDir, packageGlobs) {
    const resolvedPaths = new Set([path.join(rootDir, 'package.json')])

    for (const packageGlob of packageGlobs) {
        if (!packageGlob.endsWith('/*')) {
            const directPackageJsonPath = path.join(rootDir, packageGlob, 'package.json')
            resolvedPaths.add(directPackageJsonPath)
            continue
        }

        const baseDirectory = path.join(rootDir, packageGlob.slice(0, -2))
        let entries = []

        try {
            entries = await fs.readdir(baseDirectory, { withFileTypes: true })
        } catch {
            continue
        }

        for (const entry of entries) {
            if (!entry.isDirectory()) {
                continue
            }

            resolvedPaths.add(
                path.join(baseDirectory, entry.name, 'package.json')
            )
        }
    }

    const existingPaths = []

    for (const candidatePath of resolvedPaths) {
        try {
            const stats = await fs.stat(candidatePath)

            if (stats.isFile()) {
                existingPaths.push(candidatePath)
            }
        } catch {
            continue
        }
    }

    return existingPaths.sort()
}

export function collectCatalogReferenceIssues({
    packageJson,
    packageJsonPath,
    catalog,
    catalogs,
}) {
    const issues = []

    for (const sectionName of DEPENDENCY_SECTIONS) {
        const section = packageJson[sectionName]

        if (!section || typeof section !== 'object') {
            continue
        }

        for (const [dependencyName, dependencyVersion] of Object.entries(section)) {
            if (
                typeof dependencyVersion !== 'string' ||
                !dependencyVersion.startsWith('catalog:')
            ) {
                continue
            }

            const catalogName = dependencyVersion.slice('catalog:'.length)
            const relativePath = path.relative(ROOT_DIR, packageJsonPath)

            if (!catalogName) {
                if (!catalog.has(dependencyName)) {
                    issues.push(
                        `${relativePath} -> ${sectionName}.${dependencyName}: missing root catalog entry`
                    )
                }

                continue
            }

            const namedCatalog = catalogs.get(catalogName)

            if (!namedCatalog) {
                issues.push(
                    `${relativePath} -> ${sectionName}.${dependencyName}: unknown catalog "${catalogName}"`
                )
                continue
            }

            if (!namedCatalog.has(dependencyName)) {
                issues.push(
                    `${relativePath} -> ${sectionName}.${dependencyName}: missing entry in catalog "${catalogName}"`
                )
            }
        }
    }

    return issues
}

export async function validateCatalogReferences() {
    const workspaceSource = await fs.readFile(WORKSPACE_FILE, 'utf8')
    const workspaceConfig = parseWorkspaceCatalogConfig(workspaceSource)
    const packageJsonPaths = await resolveWorkspacePackageJsonPaths(
        ROOT_DIR,
        workspaceConfig.packages
    )
    const issues = []

    for (const packageJsonPath of packageJsonPaths) {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'))

        issues.push(
            ...collectCatalogReferenceIssues({
                packageJson,
                packageJsonPath,
                catalog: workspaceConfig.catalog,
                catalogs: workspaceConfig.catalogs,
            })
        )
    }

    return {
        workspaceConfig,
        packageJsonPaths,
        issues,
    }
}

export async function main() {
    const validation = await validateCatalogReferences()

    if (validation.issues.length > 0) {
        console.error('[repo] Catalog reference validation failed.\n')

        for (const issue of validation.issues) {
            console.error(`- ${issue}`)
        }

        process.exit(1)
    }

    console.log(
        `[repo] Catalog reference validation passed for ${validation.packageJsonPaths.length} package manifests.`
    )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await main()
}
