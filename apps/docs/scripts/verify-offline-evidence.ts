import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

type Result = {
    status: string
    retry: number
    errors: { message?: string }[]
    attachments: { name: string; path?: string; body?: string }[]
}
type Suite = {
    suites?: Suite[]
    specs?: { title: string; tests: { results: Result[] }[] }[]
}
const app = fileURLToPath(new URL('../', import.meta.url))
const cli = createRequire(import.meta.url).resolve('@playwright/test/cli')
// A runner/configuration failure must not validate stale evidence from an earlier run.
for (const output of [
    'test-results/offline/retention-probe',
    'test-results/offline-report/retention-probe.json',
    'test-results/offline-report/retention-probe-summary.json',
    'playwright-report/offline/retention-probe',
])
    rmSync(path.join(app, output), { recursive: true, force: true })
const execution = spawnSync(
    process.execPath,
    [cli, 'test', '--config=playwright.evidence.config.ts'],
    {
        cwd: app,
        encoding: 'utf8',
        timeout: 60000,
        maxBuffer: 2 * 1024 * 1024,
    }
)
assert.ifError(execution.error)
assert.equal(
    execution.status,
    1,
    'The isolated probe must fail, not pass or crash.'
)
const report = JSON.parse(
    readFileSync(
        path.join(app, 'test-results/offline-report/retention-probe.json'),
        'utf8'
    )
) as Suite & {
    stats: {
        unexpected: number
        expected: number
        skipped: number
        flaky: number
    }
}
const specs: NonNullable<Suite['specs']> = []
function collect(suite: Suite) {
    specs.push(...(suite.specs ?? []))
    for (const child of suite.suites ?? []) collect(child)
}
collect(report)
assert.equal(specs.length, 1)
assert.equal(specs[0]?.title, 'controlled trace retention failure')
assert.equal(specs[0]?.tests.length, 1)
assert.equal(specs[0]?.tests[0]?.results.length, 1)
assert.equal(report.stats.unexpected, 1)
assert.equal(
    report.stats.expected + report.stats.skipped + report.stats.flaky,
    0
)
const result = specs[0]!.tests[0]!.results[0]!
assert.equal(result.status, 'failed')
assert.equal(result.retry, 0)
assert.equal(result.errors.length, 1)
assert.match(
    result.errors[0]?.message ?? '',
    /__EXPECTED_RETENTION_PROBE_FAILURE__/
)
const trace = result.attachments.find(
    (attachment) => attachment.name === 'trace'
)?.path
assert.ok(trace, 'A failed test must retain its trace.')
const relativeTrace = path.relative(app, trace)
assert.ok(
    relativeTrace.startsWith(
        `test-results${path.sep}offline${path.sep}retention-probe${path.sep}`
    )
)
execFileSync('unzip', ['-t', trace], { stdio: 'pipe' })
assert.ok(
    statSync(
        path.join(app, 'playwright-report/offline/retention-probe/index.html')
    ).size > 0
)
const attachment = result.attachments.find(
    (attachment) => attachment.name === 'offline-article-navigation'
)
assert.ok(attachment?.body)
const navigation = JSON.parse(
    Buffer.from(attachment.body, 'base64').toString('utf8')
)
assert.equal(navigation.nprogress.status, 'observed')
assert.deepEqual(
    navigation.nprogress.samples.map(
        (sample: { busy: boolean }) => sample.busy
    ),
    [false, true, false, false]
)
const summary = {
    verifiedAt: new Date().toISOString(),
    expectedFailureVerified: true,
    childExitCode: execution.status,
    productRegression: false,
    tracePath: relativeTrace.split(path.sep).join('/'),
    traceBytes: statSync(trace).size,
    traceSha256: createHash('sha256').update(readFileSync(trace)).digest('hex'),
    zipIntegrity: 'passed',
    jsonReport: true,
    htmlReport: true,
    navigationAttachment: true,
}
writeFileSync(
    path.join(app, 'test-results/offline-report/retention-probe-summary.json'),
    JSON.stringify(summary, null, 2) + '\n'
)
console.log(
    'Controlled failure verified: JSON/HTML, navigation attachment and valid failure trace retained. Product suite results are unchanged.'
)
