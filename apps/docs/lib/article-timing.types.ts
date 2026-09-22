export type ArticleTimingStage =
    | 'document-select'
    | 'content-render'
    | 'navigation-load'
    | 'navigation-build'

export interface ArticleTimingEvent {
    traceId: string
    stage: ArticleTimingStage
    outcome: 'success' | 'error'
    durationMs: number
}

export interface ArticleTimingMeasure {
    <T>(stage: ArticleTimingStage, operation: () => T | Promise<T>): Promise<T>
}
