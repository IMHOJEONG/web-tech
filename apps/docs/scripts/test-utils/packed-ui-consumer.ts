import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import os from 'node:os'

const app = path.resolve(import.meta.dirname, '../..')
const repo = path.resolve(app, '../..')

async function run(args: string[], cwd: string) {
    await new Promise<void>((resolve, reject) => {
        const child = spawn('pnpm', args, { cwd, stdio: 'inherit' })
        const timer = setTimeout(() => {
            child.kill()
            reject(new Error(`pnpm ${args[0]} timed out`))
        }, 180_000)
        child.on('error', (error) => {
            clearTimeout(timer)
            reject(error)
        })
        child.on('exit', (code) => {
            clearTimeout(timer)
            if (code === 0) resolve()
            else reject(new Error(`pnpm ${args[0]} exited ${code}`))
        })
    })
}

export async function preparePackedUiConsumer() {
    const directory = await mkdtemp(
        path.join(os.tmpdir(), 'web-tech-ui-consumer-')
    )
    const cleanup = () => rm(directory, { recursive: true, force: true })
    try {
        const archive = path.join(directory, 'ui.tgz')
        await run(['pack', '--out', archive], path.join(repo, 'packages/ui'))
        const dependencies: Record<string, string> = {
            '@web-tech/ui': `file:${archive}`,
        }
        for (const name of [
            'react',
            'react-dom',
            '@types/react',
            '@types/react-dom',
            'tailwindcss',
            '@tailwindcss/postcss',
            'postcss',
            'typescript',
            'esbuild',
        ]) {
            dependencies[name] = (
                JSON.parse(
                    await readFile(
                        path.join(app, 'node_modules', name, 'package.json'),
                        'utf8'
                    )
                ) as { version: string }
            ).version
        }
        await writeFile(
            path.join(directory, 'package.json'),
            JSON.stringify({
                name: 'external-ui-consumer',
                private: true,
                type: 'module',
                dependencies,
            })
        )
        await run(
            [
                'install',
                '--ignore-workspace',
                '--ignore-scripts',
                '--config.engine-strict=true',
            ],
            directory
        )
        const require = createRequire(path.join(directory, 'package.json'))
        const packageRoot = path.join(directory, 'node_modules/@web-tech/ui')
        const manifest = JSON.parse(
            await readFile(path.join(packageRoot, 'package.json'), 'utf8')
        ) as {
            dependencies: Record<string, string>
            peerDependencies: Record<string, string>
            version: string
        }
        assert.equal(manifest.dependencies.react, undefined)
        assert.ok(
            manifest.peerDependencies.react &&
                manifest.peerDependencies['react-dom']
        )
        const sourceManifest = JSON.parse(
            await readFile(path.join(repo, 'packages/ui/package.json'), 'utf8')
        ) as { version: string }
        assert.equal(manifest.version, sourceManifest.version)
        const uiRequire = createRequire(path.join(packageRoot, 'package.json'))
        assert.equal(
            uiRequire('react'),
            require('react'),
            'React must be owned by the consumer'
        )
        assert.ok(
            !(
                await readFile(path.join(packageRoot, 'package.json'), 'utf8')
            ).includes('catalog:'),
            'packed catalog ranges must be resolved'
        )
        await cp(
            path.join(app, 'scripts/fixtures/ui-package-consumer/consumer.tsx'),
            path.join(directory, 'consumer.tsx')
        )
        await writeFile(
            path.join(directory, 'tsconfig.json'),
            JSON.stringify({
                compilerOptions: {
                    target: 'ES2022',
                    module: 'NodeNext',
                    moduleResolution: 'NodeNext',
                    jsx: 'react-jsx',
                    strict: true,
                    noEmit: true,
                    skipLibCheck: true,
                },
                include: ['consumer.tsx'],
            })
        )
        await run(['exec', 'tsc', '-p', 'tsconfig.json'], directory)
        const { build } = require('esbuild') as typeof import('esbuild')
        const result = await build({
            entryPoints: [path.join(directory, 'consumer.tsx')],
            bundle: true,
            write: false,
            format: 'iife',
            platform: 'browser',
            jsx: 'automatic',
            metafile: true,
            define: { 'process.env.NODE_ENV': '"production"' },
        })
        assert.ok(
            Object.keys(result.metafile!.inputs).every(
                (input) =>
                    !path
                        .resolve(input)
                        .startsWith(path.join(repo, 'packages/ui'))
            ),
            'consumer must not import workspace UI source'
        )
        const source = path.join(directory, 'consumer.css')
        await writeFile(
            source,
            '@import "@web-tech/ui/styles.css";\n@source "./consumer.tsx";\n'
        )
        const postcss = require('postcss') as typeof import('postcss').default
        const tailwind =
            require('@tailwindcss/postcss') as typeof import('@tailwindcss/postcss')
        const css = (
            await postcss([tailwind()]).process(
                await readFile(source, 'utf8'),
                { from: source }
            )
        ).css
        assert.ok(
            css.includes('.bg-primary') &&
                css.includes('--primary:') &&
                css.includes('.h-9'),
            'CSS must include tokens and classes scanned from the packed dist'
        )
        const { renderToString } =
            require('react-dom/server') as typeof import('react-dom/server')
        const { createElement } = require('react') as typeof import('react')
        const { Button } =
            require('@web-tech/ui/components/button') as typeof import('@web-tech/ui/components/button')
        assert.match(
            renderToString(createElement(Button, null, 'SSR button')),
            /SSR button/
        )
        console.info(
            '[ui-package] tarball install, single React, types, browser bundle, CSS and SSR passed'
        )
        return { bundle: result.outputFiles![0]!.text, css, cleanup }
    } catch (error) {
        await cleanup()
        throw error
    }
}
