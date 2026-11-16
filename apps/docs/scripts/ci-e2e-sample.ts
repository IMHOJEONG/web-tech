import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import {
    openSync,
    closeSync,
    mkdirSync,
    readFileSync,
    writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { availableParallelism, totalmem } from 'node:os'
import { isAbsolute, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import config from '../playwright.config.ts'
import {
    assertShardCoverage,
    finalAttempts,
    opaqueId,
    type TimingReport,
} from './e2e-performance.ts'
import {
    parsePublicSample,
    redactInventory,
    sampleIds,
    checkoutRevisionArguments,
} from './e2e-sharding-contract.ts'

const [id, privateRoot, exportRoot, runnerName] = process.argv.slice(2)
if (
    !id ||
    !runnerName ||
    !sampleIds.includes(id as (typeof sampleIds)[number]) ||
    !privateRoot ||
    !exportRoot ||
    !isAbsolute(privateRoot) ||
    !isAbsolute(exportRoot)
)
    throw new Error('Invalid CI sample arguments')
const root = fileURLToPath(new URL('../../..', import.meta.url))
const sourceSha = execFileSync('git', checkoutRevisionArguments(root), {
    cwd: root,
    encoding: 'utf8',
}).trim()
assert.equal(sourceSha, process.env.DOCS_E2E_SOURCE_SHA)
assert.equal(process.env.CI, 'true')
const contract = {
    workers: 2 as const,
    retries: config.retries,
    timeout: config.timeout,
    expectTimeout: config.expect?.timeout,
    serverTimeout: !Array.isArray(config.webServer)
        ? config.webServer?.timeout
        : undefined,
    fullyParallel: config.fullyParallel,
    trace: config.use?.trace,
}
mkdirSync(privateRoot, { recursive: true, mode: 0o700 })
mkdirSync(exportRoot, { recursive: true, mode: 0o700 })
const fd = openSync(join(privateRoot, 'driver.log'), 'wx', 0o600)
const measure = fileURLToPath(new URL('./measure-e2e.ts', import.meta.url))
const invoke = (mode: 'list' | 'run', name: string, extra: string[] = []) => {
    const result = spawnSync(
        process.execPath,
        [
            measure,
            mode,
            join(privateRoot, name),
            '--workers',
            '2',
            '--project',
            'chromium-desktop',
            ...extra,
        ],
        { cwd: root, env: { ...process.env }, stdio: ['ignore', fd, fd] }
    )
    if (result.status !== 0) throw new Error('Sample command failed')
}
const read = (name: string, file: string) =>
    JSON.parse(readFileSync(join(privateRoot, name, '1', file), 'utf8'))
let full: TimingReport['inventory'] = [],
    selected: TimingReport['inventory'] = []
let timing: TimingReport | undefined
let commandMs = 0,
    eligible = false
try {
    invoke('list', 'full')
    full = (read('full', 'timing.json') as TimingReport).inventory
    const shard = id.endsWith('baseline')
        ? []
        : ['--shard', id.endsWith('1') ? '1/2' : '2/2']
    invoke('list', 'selected', shard)
    selected = (read('selected', 'timing.json') as TimingReport).inventory
    try {
        invoke('run', 'run', shard)
    } finally {
        timing = read('run', 'timing.json') as TimingReport
        commandMs = (
            read('run', 'command.json') as { commandDurationMs: number }
        ).commandDurationMs
    }
    assertShardCoverage(selected, [timing.inventory])
    assert.equal(timing.workers, 2)
    finalAttempts(timing)
    eligible = true
} catch {
    // Failures stay failures; only allowlisted counters are exported below.
    process.exitCode = 1
} finally {
    closeSync(fd)
}
const require = createRequire(import.meta.url)
const sample = parsePublicSample({
    version: 1,
    id,
    sourceSha,
    runner: opaqueId(runnerName),
    node: process.version,
    playwright: (
        require('@playwright/test/package.json') as { version: string }
    ).version,
    cpuCount: availableParallelism(),
    memoryBytes: totalmem(),
    contract,
    full: redactInventory(full),
    selected: redactInventory(selected),
    attempts: (timing?.attempts ?? []).map((entry) => ({
        id: entry.id,
        retry: entry.retry,
        status: entry.status,
        expectedStatus: entry.expectedStatus,
        durationMs: entry.durationMs,
        workerIndex: entry.workerIndex,
        failureKind: entry.failureKind ?? 'none',
        failureLine: entry.failureLine,
    })),
    status: timing?.status === 'passed' ? 'passed' : 'failed',
    globalErrors: timing?.globalErrors ?? 1,
    commandMs,
    runnerMs: timing?.runnerDurationMs ?? 0,
    eligible,
})
writeFileSync(join(exportRoot, 'sample.json'), JSON.stringify(sample), {
    flag: 'wx',
    mode: 0o600,
})
console.log(
    JSON.stringify({
        id: sample.id,
        eligible: sample.eligible,
        tests: sample.selected.length,
        commandMs: Math.round(sample.commandMs),
        status: sample.status,
    })
)
