import { PassThrough } from 'node:stream'
import { createElement } from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import { expect, test } from '@playwright/test'
import { ArticleSupplementaryBoundary } from '../widgets/article-detail/ui/article-supplementary-boundary'

test('streams body before supplementary data is released', async () => {
    let release!: () => void
    const pending = new Promise<void>((resolve) => {
        release = resolve
    })
    async function DelayedSupplementary() {
        await pending
        return createElement('p', null, 'supplementary-ready')
    }

    let output = ''
    const stream = new PassThrough()
    const firstChunk = new Promise<void>((resolve, reject) => {
        stream.once('data', () => resolve())
        stream.once('error', reject)
    })
    stream.on('data', (chunk) => {
        output += chunk.toString()
    })
    const finished = new Promise<void>((resolve, reject) => {
        stream.on('end', resolve)
        stream.on('error', reject)
    })
    void finished.catch(() => {})
    const errors: unknown[] = []
    const renderer = renderToPipeableStream(
        createElement(
            'html',
            null,
            createElement('head'),
            createElement(
                'body',
                null,
                createElement('article', null, 'body-ready'),
                createElement(
                    ArticleSupplementaryBoundary,
                    {
                        loadingLabel: 'Loading related documents',
                    },
                    createElement(DelayedSupplementary)
                )
            )
        ),
        {
            onShellReady() {
                renderer.pipe(stream)
            },
            onError(error) {
                errors.push(error)
            },
            onShellError(error) {
                stream.destroy(
                    error instanceof Error ? error : new Error(String(error))
                )
            },
        }
    )
    try {
        await firstChunk
        expect(output).toContain('body-ready')
        expect(output).toContain('article-supplementary-pending')
        expect(output).not.toContain('supplementary-ready')
        release()
        await finished
        expect(output).toContain('supplementary-ready')
        expect(errors).toEqual([])
    } finally {
        release()
        renderer.abort()
        stream.destroy()
    }
})
