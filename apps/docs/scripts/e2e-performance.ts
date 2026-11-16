import { createHash } from 'node:crypto'

export const phases = [
    'server-html',
    'navigation',
    'fonts',
    'geometry',
    'snapshot-clone',
    'snapshot-page',
    'snapshot-fonts',
    'snapshot-navigation',
    'snapshot-font-ready',
    'screenshot',
    'profile-launch',
    'profile-close',
] as const
export type Phase = (typeof phases)[number]
export type Measurement = { count: number; totalMs: number; maxMs: number }
export type Inventory = { id: string; file: string; project: string }
export type Attempt = {
    id: string
    retry: number
    status: string
    expectedStatus: string
    durationMs: number
    workerIndex: number
    failureKind?:
        | 'none'
        | 'timeout'
        | 'assertion'
        | 'network'
        | 'network-suspended'
        | 'other'
    phases: Partial<Record<Phase, Measurement>>
    api: Record<string, Measurement>
}
export type TimingReport = {
    version: 1
    mode: 'list' | 'run'
    workers: number
    shard: { current: number; total: number } | null
    runnerDurationMs: number
    status: string
    globalErrors: number
    inventory: Inventory[]
    attempts: Attempt[]
}

export function opaqueId(value: string) {
    return createHash('sha256').update(value).digest('hex')
}

export function phaseFromTitle(title: string): Phase | undefined {
    return phases.find((phase) => title === `perf:${phase}`)
}

// Never serialize step titles: Playwright can include URLs, selectors and input.
export function apiCategory(title: string): string {
    if (
        /^(?:(?:page|frame)\.(?:goto|reload|goBack|goForward)\b|Navigate to |Reload|Go back|Go forward)/.test(
            title
        )
    )
        return 'navigation'
    if (
        /^(?:(?:apiRequestContext|request)\.|(?:GET|POST|PUT|PATCH|DELETE|HEAD)\s)/.test(
            title
        )
    )
        return 'request'
    if (
        /^(?:(?:page|locator|elementHandle)\.screenshot\b|Screenshot\b)/.test(
            title
        )
    )
        return 'screenshot'
    if (/^(?:browserType|browser|browserContext)\./.test(title))
        return 'browser'
    if (
        /^(?:(?:page|frame|locator|jsHandle|elementHandle)\.(?:evaluate|evaluateAll|evaluateHandle)\b|Evaluate\b)/.test(
            title
        )
    )
        return 'evaluate'
    return 'other'
}

export function record(
    totals: Record<string, Measurement | undefined>,
    key: string,
    duration: number
) {
    if (!Number.isFinite(duration) || duration < 0)
        throw new Error('Invalid timing duration')
    const previous = totals[key] ?? { count: 0, totalMs: 0, maxMs: 0 }
    totals[key] = {
        count: previous.count + 1,
        totalMs: previous.totalMs + duration,
        maxMs: Math.max(previous.maxMs, duration),
    }
}

export function assertShardCoverage(
    expected: Inventory[],
    parts: Inventory[][]
) {
    const expectedIds = new Set(expected.map((item) => item.id))
    if (!expectedIds.size || expectedIds.size !== expected.length)
        throw new Error('Empty or duplicate baseline inventory')
    const seen = new Set<string>()
    for (const part of parts) {
        if (!part.length) throw new Error('Empty shard')
        for (const item of part) {
            if (!expectedIds.has(item.id)) throw new Error('Unexpected test ID')
            if (seen.has(item.id)) throw new Error('Duplicate test ID')
            seen.add(item.id)
            const original = expected.find((test) => test.id === item.id)!
            if (
                original.file !== item.file ||
                original.project !== item.project
            )
                throw new Error('Changed test identity')
        }
    }
    if (seen.size !== expectedIds.size) throw new Error('Missing test IDs')
}

export function finalAttempts(report: TimingReport): Map<string, Attempt> {
    if (
        report.mode !== 'run' ||
        report.status !== 'passed' ||
        report.globalErrors
    )
        throw new Error('Unsuccessful run')
    const final = new Map<string, Attempt>()
    const seen = new Set<string>()
    const inventory = new Set(report.inventory.map((item) => item.id))
    for (const attempt of report.attempts) {
        const key = `${attempt.id}:${attempt.retry}`
        if (!inventory.has(attempt.id) || seen.has(key))
            throw new Error('Unexpected or duplicate attempt')
        seen.add(key)
        if (
            attempt.status !== attempt.expectedStatus &&
            attempt.status !== 'skipped'
        )
            throw new Error('Failed or retried attempt')
        if (attempt.retry !== 0) throw new Error('Retry requires investigation')
        final.set(attempt.id, attempt)
    }
    if (final.size !== inventory.size) throw new Error('Incomplete run')
    return final
}

export function assertComparable(
    baseline: TimingReport,
    parts: TimingReport[]
) {
    const before = finalAttempts(baseline)
    assertShardCoverage(
        baseline.inventory,
        parts.map((part) => part.inventory)
    )
    for (const part of parts) {
        for (const [id, after] of finalAttempts(part)) {
            const original = before.get(id)!
            if (
                original.status !== after.status ||
                original.expectedStatus !== after.expectedStatus
            )
                throw new Error('Changed skip or expected status')
        }
    }
}

export function assertInventoryReports(
    baseline: TimingReport,
    parts: TimingReport[]
) {
    if (
        [baseline, ...parts].some(
            (report) =>
                report.mode !== 'list' ||
                report.status !== 'passed' ||
                report.globalErrors !== 0 ||
                report.attempts.length !== 0
        )
    )
        throw new Error('Invalid list report')
    assertShardCoverage(
        baseline.inventory,
        parts.map((part) => part.inventory)
    )
}
