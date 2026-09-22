import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const result = await build({
    entryPoints: [
        fileURLToPath(
            new URL('../ui-e2e/fixtures/primitives.tsx', import.meta.url)
        ),
    ],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    minify: true,
    metafile: true,
    define: { 'process.env.NODE_ENV': '"production"' },
})

const bytes = result.outputFiles[0]!.contents
const inputs = Object.keys(result.metafile.inputs)
const primitivePackages = [
    ...new Set(
        inputs.flatMap((path) => {
            const match = path.match(
                /\.pnpm\/(@(?:radix-ui|base-ui)\+[^/]+?)\/node_modules/
            )
            return match ? [match[1]!.split('(')[0]] : []
        })
    ),
].sort()

// This fixture measurement is not the production Next.js route bundle size.
console.log(
    JSON.stringify(
        {
            fixture: 'ui-e2e/fixtures/primitives.tsx',
            minifiedBytes: bytes.length,
            gzipBytes: gzipSync(bytes).length,
            commonJsRadixEntry: inputs.some((path) =>
                path.endsWith('/radix-ui/dist/index.js')
            ),
            primitivePackages,
        },
        null,
        2
    )
)
