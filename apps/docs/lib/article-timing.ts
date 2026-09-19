import { randomUUID } from 'node:crypto'
import { performance } from 'node:perf_hooks'

import type {
    ArticleTimingEvent,
    ArticleTimingMeasure,
    ArticleTimingStage,
} from './article-timing.types.ts'

export function createArticleTiming(
    emit: (event: ArticleTimingEvent) => void = (event) => {
        console.info('[docs.article_timing]', event)
    },
    now: () => number = () => performance.now()
): ArticleTimingMeasure {
    const traceId = randomUUID()

    return async function measure<T>(
        stage: ArticleTimingStage,
        operation: () => T | Promise<T>
    ): Promise<T> {
        const startedAt = now()
        let outcome: ArticleTimingEvent['outcome'] = 'error'

        try {
            const result = await operation()
            outcome = 'success'
            return result
        } finally {
            // Telemetry must not change the rendering result or expose its data.
            try {
                emit({
                    traceId,
                    stage,
                    outcome,
                    durationMs: Math.max(
                        0,
                        Math.round((now() - startedAt) * 100) / 100
                    ),
                })
            } catch {
                // Logging failures must not replace the original error.
            }
        }
    }
}
