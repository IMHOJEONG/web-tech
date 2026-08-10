import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'path'
import {
    collectCatalogReferenceIssues,
    parseWorkspaceCatalogConfig,
} from './validate-catalog-references.mjs'

test('parseWorkspaceCatalogConfig reads packages, root catalog, and named catalogs', () => {
    const parsed = parseWorkspaceCatalogConfig(`
packages:
  - "apps/*"
  - "packages/*"

catalog:
  react: "^19.2.6"
  typescript: "^6.0.3"

catalogs:
  docs:
    next: "16.2.6"
    next-intl: "^4.9.1"
  backend:
    "@nestjs/core": "^11.1.18"
`)

    assert.deepEqual(parsed.packages, ['apps/*', 'packages/*'])
    assert.equal(parsed.catalog.get('react'), '^19.2.6')
    assert.equal(parsed.catalogs.get('docs')?.get('next'), '16.2.6')
    assert.equal(
        parsed.catalogs.get('backend')?.get('@nestjs/core'),
        '^11.1.18'
    )
})

test('collectCatalogReferenceIssues reports missing root and named catalog entries', () => {
    const issues = collectCatalogReferenceIssues({
        packageJson: {
            dependencies: {
                react: 'catalog:',
                next: 'catalog:docs',
                ky: 'catalog:web',
            },
            devDependencies: {
                typescript: 'catalog:',
            },
        },
        packageJsonPath: path.join(process.cwd(), 'apps/docs/package.json'),
        catalog: new Map([['react', '^19.2.6']]),
        catalogs: new Map([
            ['docs', new Map([['next', '16.2.6']])],
            ['ui', new Map([['motion', '^12.34.0']])],
        ]),
    })

    assert.deepEqual(issues, [
        'apps/docs/package.json -> dependencies.ky: unknown catalog "web"',
        'apps/docs/package.json -> devDependencies.typescript: missing root catalog entry',
    ])
})

test('collectCatalogReferenceIssues passes when every catalog reference resolves', () => {
    const issues = collectCatalogReferenceIssues({
        packageJson: {
            dependencies: {
                react: 'catalog:',
                next: 'catalog:docs',
            },
            devDependencies: {
                typescript: 'catalog:',
            },
        },
        packageJsonPath: path.join(process.cwd(), 'apps/docs/package.json'),
        catalog: new Map([
            ['react', '^19.2.6'],
            ['typescript', '^6.0.3'],
        ]),
        catalogs: new Map([
            ['docs', new Map([['next', '16.2.6']])],
        ]),
    })

    assert.deepEqual(issues, [])
})
