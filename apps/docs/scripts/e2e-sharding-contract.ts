import { z } from 'zod'
import { isAbsolute, parse } from 'node:path'
import {
    assertComparable,
    assertShardCoverage,
    finalAttempts,
    opaqueId,
    type TimingReport,
} from './e2e-performance.ts'

const hash = z.string().regex(/^[a-f0-9]{64}$/)

export function checkoutRevisionArguments(workspace: string) {
    if (
        !isAbsolute(workspace) ||
        workspace === parse(workspace).root ||
        /[\r\n\0*]/.test(workspace)
    )
        throw new Error('Expected one explicit checkout directory')
    // Container bind mounts can have a different UID. Trust only this command,
    // never the host configuration or every repository.
    return ['-c', `safe.directory=${workspace}`, 'rev-parse', 'HEAD']
}
const duration = z.number().finite().nonnegative()
const item = z
    .object({ id: hash, file: hash, project: z.literal('chromium-desktop') })
    .strict()
const attempt = z
    .object({
        id: hash,
        retry: z.number().int().nonnegative(),
        status: z.enum([
            'passed',
            'failed',
            'timedOut',
            'skipped',
            'interrupted',
        ]),
        expectedStatus: z.enum(['passed', 'failed', 'skipped']),
        durationMs: duration,
        workerIndex: z.number().int(),
        failureKind: z
            .enum([
                'none',
                'timeout',
                'assertion',
                'network',
                'network-suspended',
                'other',
            ])
            .default('none'),
    })
    .strict()
export const sampleIds = [
    'r1-baseline',
    'r1-shard-1',
    'r1-shard-2',
    'r2-shard-2',
    'r2-baseline',
    'r2-shard-1',
    'r3-shard-1',
    'r3-shard-2',
    'r3-baseline',
] as const
export const publicSampleSchema = z
    .object({
        version: z.literal(1),
        id: z.enum(sampleIds),
        sourceSha: z.string().regex(/^[a-f0-9]{40}$/),
        runner: hash,
        node: z.string().regex(/^v24\.\d+\.\d+$/),
        playwright: z.string().regex(/^\d+\.\d+\.\d+$/),
        cpuCount: z.number().int().positive(),
        memoryBytes: z.number().int().positive(),
        contract: z
            .object({
                workers: z.literal(2),
                retries: z.literal(2),
                timeout: z.literal(30000),
                expectTimeout: z.literal(5000),
                serverTimeout: z.literal(120000),
                fullyParallel: z.literal(true),
                trace: z.literal('on-first-retry'),
            })
            .strict(),
        full: z.array(item).max(10000),
        selected: z.array(item).max(10000),
        attempts: z.array(attempt).max(30000),
        status: z.enum(['passed', 'failed', 'timedout', 'interrupted']),
        globalErrors: z.number().int().nonnegative(),
        commandMs: duration,
        runnerMs: duration,
        eligible: z.boolean(),
    })
    .strict()
export type PublicSample = z.infer<typeof publicSampleSchema>

export function redactInventory(inventory: TimingReport['inventory']) {
    return inventory.map((entry) => ({
        id: entry.id,
        file: opaqueId(entry.file),
        project: entry.project,
    }))
}

export function timingFromSample(sample: PublicSample): TimingReport {
    return {
        version: 1,
        mode: 'run',
        workers: 2,
        shard: sample.id.endsWith('baseline')
            ? null
            : { current: sample.id.endsWith('1') ? 1 : 2, total: 2 },
        inventory: sample.selected,
        runnerDurationMs: sample.runnerMs,
        status: sample.status,
        globalErrors: sample.globalErrors,
        attempts: sample.attempts.map((entry) => ({
            ...entry,
            phases: {},
            api: {},
        })),
    }
}

export function parsePublicSample(value: unknown): PublicSample {
    const parsed = publicSampleSchema.safeParse(value)
    if (!parsed.success)
        throw new Error('Invalid public sample; payload omitted')
    return parsed.data
}

export function summarizeSamples(input: unknown[], expectedSha: string) {
    const samples = input.map(parsePublicSample)
    if (
        samples.length !== sampleIds.length ||
        new Set(samples.map((s) => s.id)).size !== sampleIds.length
    )
        throw new Error('Missing or duplicate sample')
    if (new Set(samples.map((s) => s.runner)).size !== samples.length)
        throw new Error('Samples must use independent runners')
    const first = samples[0]!
    for (const sample of samples) {
        if (
            !sample.eligible ||
            sample.sourceSha !== expectedSha ||
            sample.node !== first.node ||
            sample.playwright !== first.playwright ||
            sample.cpuCount !== first.cpuCount ||
            Math.round(sample.memoryBytes / 1024 ** 3) !==
                Math.round(first.memoryBytes / 1024 ** 3)
        )
            throw new Error('Failed sample or inconsistent environment')
        assertShardCoverage(first.full, [sample.full])
        finalAttempts(timingFromSample(sample))
    }
    const rounds = [1, 2, 3].map((round) => {
        const baseline = samples.find((s) => s.id === `r${round}-baseline`)!
        const shards = [1, 2].map(
            (shard) => samples.find((s) => s.id === `r${round}-shard-${shard}`)!
        )
        assertShardCoverage(baseline.full, [baseline.selected])
        assertComparable(
            timingFromSample(baseline),
            shards.map(timingFromSample)
        )
        const shardMaxMs = Math.max(...shards.map((s) => s.commandMs))
        return {
            round,
            tests: baseline.full.length,
            baselineMs: baseline.commandMs,
            shardMaxMs,
            shardSumMs: shards.reduce((sum, s) => sum + s.commandMs, 0),
            changePercent: 100 * (shardMaxMs / baseline.commandMs - 1),
        }
    })
    return {
        version: 1,
        sourceSha: expectedSha,
        workers: 2,
        rounds,
        scope: 'command duration only; runner queue, image and install excluded; no automatic CI adoption',
    }
}
