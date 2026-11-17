export const articleMainAnnotation = 'article-main-failure-v1'

export type ArticleMainFailure = {
    actualCount: number | null
    roleCount: number
    domCount: number
    pendingCount: number
    bodyCount: number
    bodyVisible: boolean
}

const fields = [
    'actualCount',
    'roleCount',
    'domCount',
    'pendingCount',
    'bodyCount',
    'bodyVisible',
] as const
const count = (value: unknown): value is number =>
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 1000

export function parseArticleMainFailure(
    value: unknown
): ArticleMainFailure | undefined {
    if (!value || typeof value !== 'object') return
    const entry = value as Record<string, unknown>
    if (
        Object.keys(entry).length !== fields.length ||
        Object.keys(entry).some(
            (field) => !fields.includes(field as (typeof fields)[number])
        ) ||
        !(entry.actualCount === null || count(entry.actualCount)) ||
        !count(entry.roleCount) ||
        !count(entry.domCount) ||
        !count(entry.pendingCount) ||
        !count(entry.bodyCount) ||
        typeof entry.bodyVisible !== 'boolean'
    )
        return
    return Object.fromEntries(
        fields.map((field) => [field, entry[field]])
    ) as ArticleMainFailure
}

export function actualMainCount(error: unknown): number | null {
    if (!error || typeof error !== 'object' || !('matcherResult' in error))
        return null
    const result = error.matcherResult as Record<string, unknown> | undefined
    return result?.name === 'toHaveCount' && count(result.actual)
        ? result.actual
        : null
}

export async function observeArticleMainFailure(
    check: () => Promise<unknown>,
    snapshot: (error: unknown) => Promise<unknown>,
    annotate: (value: ArticleMainFailure) => void
) {
    try {
        await check()
    } catch (error) {
        try {
            const value = parseArticleMainFailure(await snapshot(error))
            if (value) annotate(value)
        } catch {
            // Diagnostic failure must never replace the original assertion.
        }
        throw error
    }
}
