import { appendFileSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { sampleIds, summarizeSamples } from './e2e-sharding-contract.ts'

const [directory, summaryPath, attempt] = process.argv.slice(2)
const sha = process.env.DOCS_E2E_SOURCE_SHA ?? ''
if (
    !directory ||
    !attempt ||
    !/^[1-9]\d*$/.test(attempt) ||
    !/^[a-f0-9]{40}$/.test(sha)
)
    throw new Error('Invalid aggregation arguments')
const folders = readdirSync(directory)
if (folders.length !== sampleIds.length)
    throw new Error('Missing or extra artifact')
const samples = sampleIds.map((id) => {
    const folder = `e2e-shard-${id}-${attempt}`
    if (!folders.includes(folder)) throw new Error('Missing sample artifact')
    const bytes = readFileSync(join(directory, folder, 'sample.json'))
    if (bytes.length > 2 * 1024 * 1024) throw new Error('Oversized sample')
    try {
        return JSON.parse(bytes.toString()) as unknown
    } catch {
        throw new Error('Invalid sample JSON; content omitted')
    }
})
const summary = summarizeSamples(samples, sha)
console.log(JSON.stringify(summary))
if (summaryPath) {
    const rows = summary.rounds
        .map(
            (r) =>
                `| ${r.round} | ${(r.baselineMs / 1000).toFixed(1)} | ${(r.shardMaxMs / 1000).toFixed(1)} | ${(r.shardSumMs / 1000).toFixed(1)} | ${r.changePercent.toFixed(1)}% |`
        )
        .join('\n')
    appendFileSync(
        summaryPath,
        `## Desktop E2E: workers=2\n\n| Round | Baseline seconds | Shard max seconds | Shard sum seconds | Change |\n|---|---:|---:|---:|---:|\n${rows}\n\n${summary.scope}\n`
    )
}
