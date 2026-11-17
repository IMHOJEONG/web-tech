import { existsSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import type {
    FullConfig,
    FullResult,
    Reporter,
    Suite,
    TestCase,
    TestResult,
    TestStep,
} from '@playwright/test/reporter'
import {
    articleMainAnnotation,
    parseArticleMainFailure,
} from './article-main-diagnostic.ts'
import {
    apiCategory,
    opaqueId,
    phaseFromTitle,
    record,
    type Attempt,
    type TimingReport,
} from './e2e-performance.ts'

export default class TimingReporter implements Reporter {
    private report!: TimingReport
    private attempts = new WeakMap<TestResult, Attempt>()
    private output: string

    constructor() {
        const output = process.env.DOCS_E2E_TIMING_FILE
        if (!output || !isAbsolute(output))
            throw new Error('Timing output must be an absolute private path')
        // Fail closed before the run; never add raw timing evidence to checkout.
        const root = realpathSync(
            fileURLToPath(new URL('../../..', import.meta.url))
        )
        mkdirSync(dirname(output), { recursive: true, mode: 0o700 })
        const directory = realpathSync(dirname(output))
        const inside = relative(root, directory)
        if (
            !inside ||
            (!inside.startsWith(`..${sep}`) &&
                inside !== '..' &&
                !isAbsolute(inside))
        )
            throw new Error('Timing output must be outside the repository')
        this.output = resolve(directory, output.split(sep).at(-1)!)
        if (existsSync(this.output))
            throw new Error('Timing output already exists; use a new sample')
    }

    onBegin(config: FullConfig, suite: Suite) {
        this.report = {
            version: 1,
            mode: process.env.DOCS_E2E_TIMING_MODE === 'list' ? 'list' : 'run',
            workers: config.workers,
            shard: config.shard,
            runnerDurationMs: 0,
            status: 'running',
            globalErrors: 0,
            inventory: suite.allTests().map((test) => ({
                id: opaqueId(test.id),
                file: relative(config.rootDir, test.location.file).replaceAll(
                    '\\',
                    '/'
                ),
                project: test.parent.project()!.name,
            })),
            attempts: [],
        }
    }

    onTestBegin(test: TestCase, result: TestResult) {
        this.attempts.set(result, {
            id: opaqueId(test.id),
            retry: result.retry,
            status: 'running',
            expectedStatus: test.expectedStatus,
            durationMs: 0,
            workerIndex: result.workerIndex,
            phases: {},
            api: {},
        })
    }

    onStepEnd(_test: TestCase, result: TestResult, step: TestStep) {
        const attempt = this.attempts.get(result)
        if (!attempt) return
        const phase = phaseFromTitle(step.title)
        if (step.category === 'test.step' && phase)
            record(attempt.phases, phase, step.duration)
        if (step.category === 'pw:api')
            record(attempt.api, apiCategory(step.title), step.duration)
    }

    onTestEnd(test: TestCase, result: TestResult) {
        const attempt = this.attempts.get(result)!
        attempt.status = result.status
        attempt.expectedStatus = test.expectedStatus
        attempt.durationMs = result.duration
        const message =
            result.errors?.map((error) => error.message ?? '').join('\n') ?? ''
        attempt.failureKind =
            result.status === 'passed' || result.status === 'skipped'
                ? 'none'
                : result.status === 'timedOut'
                  ? 'timeout'
                  : message.includes('ERR_NETWORK_IO_SUSPENDED')
                    ? 'network-suspended'
                    : message.includes('net::ERR_')
                      ? 'network'
                      : /expect\(|AssertionError/.test(message)
                        ? 'assertion'
                        : 'other'
        const location = result.errors?.find(
            (error) => error.location?.file === test.location.file
        )?.location
        if (
            attempt.failureKind !== 'none' &&
            Number.isInteger(location?.line) &&
            location!.line > 0 &&
            location!.line <= 1_000_000
        )
            attempt.failureLine = location!.line
        if (attempt.failureKind !== 'none') {
            const raw = result.annotations?.find(
                (item) => item.type === articleMainAnnotation
            )?.description
            if (raw && raw.length <= 512) {
                try {
                    const value = parseArticleMainFailure(JSON.parse(raw))
                    if (value) attempt.failureMain = value
                } catch {
                    // Annotation text and malformed payloads are never exported.
                }
            }
        }
        this.report.attempts.push(attempt)
    }

    onError() {
        this.report.globalErrors++
    }

    async onEnd(result: FullResult) {
        this.report.status = result.status
        this.report.runnerDurationMs = result.duration
        try {
            writeFileSync(this.output, JSON.stringify(this.report), {
                flag: 'wx',
                mode: 0o600,
            })
        } catch {
            // Playwright logs reporter exceptions without necessarily failing tests.
            return { status: 'failed' as const }
        }
    }
}
