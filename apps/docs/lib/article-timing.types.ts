export type ArticleTimingStage =
    | 'document-select'
    | 'document-load'
    | 'remote-detail'
    | 'content-render'
    | 'navigation-load'
    | 'navigation-build'
    | 'search-local'
    | 'search-remote'
    | 'search-rank'

export interface ArticleTimingEvent {
    traceId: string
    stage: ArticleTimingStage
    outcome: 'success' | 'error'
    durationMs: number
    requestId?: string | null
    durationScope?: 'operation'
}

export interface ArticleTimingMeasure {
    <T>(stage: ArticleTimingStage, operation: () => T | Promise<T>): Promise<T>
}
