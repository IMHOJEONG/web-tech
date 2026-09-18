import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import test from 'node:test'
import ts from 'typescript'

const require = createRequire(import.meta.url)
// Exercise the installed Next loader without building or starting the app.
const loader =
    require('next/dist/compiled/@next/font/dist/local/loader').default
const configPath = fileURLToPath(
    new URL('../shared/config/fonts.ts', import.meta.url)
)
const compiled = ts.transpileModule(readFileSync(configPath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText
const exports = {}
runInNewContext(compiled, {
    exports,
    require(name) {
        assert.equal(name, 'next/font/local')
        return { __esModule: true, default: (config) => config }
    },
})

for (const [name, expectedFaces, shouldPreload] of [
    ['pretendard', 1, true],
    ['spaceGrotesk', 1, true],
    ['mono', 16, false],
]) {
    test(`${name}: preserve font faces and preload policy`, async () => {
        const emitted = []
        const result = await loader({
            functionName: '',
            variableName: name,
            data: [exports[name]],
            resolve: async (src) => path.resolve(path.dirname(configPath), src),
            loaderContext: { fs },
            emitFontFile(_buffer, extension, preload) {
                emitted.push(preload)
                return `/test-font-${emitted.length}.${extension}`
            },
        })
        assert.equal(emitted.length, expectedFaces)
        assert.ok(emitted.every((value) => value === shouldPreload))
        assert.equal(
            (result.css.match(/@font-face/g) || []).length,
            expectedFaces
        )
        assert.equal(
            (result.css.match(/font-display: swap/g) || []).length,
            expectedFaces
        )
        assert.equal(result.variable, exports[name].variable)
    })
}
