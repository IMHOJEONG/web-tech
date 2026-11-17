import { spawn } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { arch, platform } from 'node:os'
import { dirname, isAbsolute, join, relative, sep } from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'
import {
    assertComparable,
    assertInventoryReports,
    assertShardCoverage,
    finalAttempts,
    type TimingReport,
} from './e2e-performance.ts'

const app = fileURLToPath(new URL('..', import.meta.url))
const repository = await realpath(join(app, '../..'))
const [mode, output, ...args] = process.argv.slice(2)
if (
    !['list', 'run', 'compare'].includes(mode ?? '') ||
    !output ||
    !isAbsolute(output)
)
    throw new Error(
        'Use list|run|compare /absolute/private/output [options or report paths]'
    )
await mkdir(output, { recursive: true, mode: 0o700 })
const directory = await realpath(output)
const inside = relative(repository, directory)
if (
    !inside ||
    (!inside.startsWith(`..${sep}`) && inside !== '..' && !isAbsolute(inside))
)
    throw new Error('Output must be outside repository')

async function report(file: string): Promise<TimingReport> {
    const bytes = await readFile(file)
    if (bytes.length > 10 * 1024 * 1024) throw new Error('Report too large')
    try {
        return JSON.parse(bytes.toString()) as TimingReport
    } catch {
        throw new Error('Invalid timing JSON; contents omitted')
    }
}

if (mode === 'compare') {
    if (args.length < 2)
        throw new Error('Provide baseline and candidate report paths')
    const [baseline, ...parts] = await Promise.all(args.map(report))
    if (baseline!.mode === 'list') {
        assertInventoryReports(baseline!, parts)
    } else assertComparable(baseline!, parts)
    console.log(
        JSON.stringify({
            coverage: 'identical',
            tests: baseline!.inventory.length,
            parts: parts.length,
        })
    )
} else {
    const options = new Map<string, string>()
    for (let index = 0; index < args.length; index += 2) {
        const name = args[index]!
        const value = args[index + 1]
        if (
            ![
                '--workers',
                '--shard',
                '--steps',
                '--repeat',
                '--project',
                '--port',
            ].includes(name) ||
            !value ||
            options.has(name)
        )
            throw new Error('Unknown, missing or duplicate benchmark option')
        options.set(name, value)
    }
    const workers = options.get('--workers') ?? '2'
    const steps = options.get('--steps') ?? 'on'
    const repeat = options.get('--repeat') ?? '1'
    const project = options.get('--project') ?? 'chromium-desktop'
    const port = options.get('--port') ?? '3078'
    const shard = options.get('--shard')
    if (
        !['1', '2', '4'].includes(workers) ||
        !['on', 'off'].includes(steps) ||
        !['1', '2', '3'].includes(repeat) ||
        ![
            'chromium-desktop',
            'chromium-mobile',
            'chromium-tablet',
            'all',
        ].includes(project) ||
        !/^\d{4,5}$/.test(port) ||
        Number(port) > 65535 ||
        (shard && !['1/2', '2/2'].includes(shard))
    )
        throw new Error('Invalid benchmark option')
    const require = createRequire(import.meta.url)
    const cli = join(
        dirname(require.resolve('@playwright/test/package.json')),
        'cli.js'
    )
    for (let index = 1; index <= Number(repeat); index++) {
        const sample = join(directory, String(index))
        await mkdir(sample, { mode: 0o700 })
        const timingFile = join(sample, 'timing.json')
        const startedAt = new Date()
        const started = performance.now()
        const command = [
            'test',
            '--config=playwright.config.ts',
            `--workers=${workers}`,
            '--reporter=list,./scripts/e2e-timing-reporter.ts',
            `--output=${join(sample, 'results')}`,
        ]
        if (project !== 'all') command.push(`--project=${project}`)
        if (shard) command.push(`--shard=${shard}`)
        if (mode === 'list') command.push('--list')
        const logs = createWriteStream(join(sample, 'private.log'), {
            flags: 'wx',
            mode: 0o600,
        })
        const child = spawn(process.execPath, [cli, ...command], {
            cwd: app,
            detached: process.platform !== 'win32',
            env: {
                ...process.env,
                DOCS_E2E_PORT: port,
                DOCS_E2E_TIMING_FILE: timingFile,
                DOCS_E2E_TIMING_STEPS: steps === 'on' ? '1' : '0',
                DOCS_E2E_TIMING_MODE: mode,
            },
            stdio: ['ignore', 'pipe', 'pipe'],
        })
        child.stdout.pipe(logs, { end: false })
        child.stderr.pipe(logs, { end: false })
        const stop = () => {
            if (child.pid)
                process.kill(
                    process.platform === 'win32' ? child.pid : -child.pid,
                    'SIGTERM'
                )
        }
        process.once('SIGINT', stop)
        process.once('SIGTERM', stop)
        const exitCode = await new Promise<number | null>((resolve, reject) => {
            child.once('error', reject)
            child.once('close', resolve)
        }).finally(() => {
            process.removeListener('SIGINT', stop)
            process.removeListener('SIGTERM', stop)
            logs.end()
        })
        const commandDurationMs = performance.now() - started
        const endedAt = new Date()
        await writeFile(
            join(sample, 'command.json'),
            JSON.stringify({
                version: 1,
                node: process.version,
                platform: platform(),
                arch: arch(),
                workers: Number(workers),
                steps,
                project,
                shard: shard ?? null,
                startedAt: startedAt.toISOString(),
                endedAt: endedAt.toISOString(),
                wallDurationMs: endedAt.getTime() - startedAt.getTime(),
                commandDurationMs,
                exitCode,
            }),
            { flag: 'wx', mode: 0o600 }
        )
        if (exitCode !== 0)
            throw new Error(
                'Benchmark failed; inspect private sample, do not discard or rank it'
            )
        const result = await report(timingFile)
        if (mode === 'run') finalAttempts(result)
        else {
            if (result.status !== 'passed') throw new Error('Unsuccessful list')
            assertShardCoverage(result.inventory, [result.inventory])
        }
        console.log(
            JSON.stringify({
                sample: index,
                workers,
                steps,
                project,
                shard: shard ?? null,
                tests: result.inventory.length,
                attempts: result.attempts.length,
                commandDurationMs: Math.round(commandDurationMs),
                runnerDurationMs: result.runnerDurationMs,
                status: result.status,
            })
        )
    }
}
