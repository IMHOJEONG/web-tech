import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { readReviews } from '../../../scripts/check-publication.mts'
import {
    parseContentRelease,
    stagePrivateContent,
} from './prepare-private-content.ts'
import { main as validateMetadata } from './validate-content.mjs'
import { main as validateStyle } from './validate-content-style.mjs'

// Local verification only: never fetch credentials or change a remote repository.
const appRoot = fileURLToPath(new URL('../', import.meta.url))
try {
    const localGit = process.env.DOCS_PRIVATE_CONTENT_LOCAL_GIT
    const reviewFile = process.env.DOCS_PRIVATE_CONTENT_REVIEW_FILE
    if (!localGit || !reviewFile) throw new Error('Local inputs are required')
    const release = parseContentRelease(
        JSON.parse(
            fs.readFileSync(
                new URL('../content-release.lock.json', import.meta.url),
                'utf8'
            )
        )
    )
    const reviews = readReviews(fs.readFileSync(reviewFile))
    const result = await stagePrivateContent(
        appRoot,
        release,
        (args) =>
            execFileSync('git', args, {
                cwd: localGit,
                timeout: 45000,
                maxBuffer: 32 * 1024 * 1024,
                stdio: ['ignore', 'pipe', 'pipe'],
            }),
        reviews
    )
    process.env.DOCS_CONTENT_SOURCE = 'private-git'
    process.env.DOCS_PRIVATE_CONTENT_REVISION = release.revision
    await validateMetadata()
    await validateStyle()
    console.info('[docs.content_release_verified]', {
        revision: release.revision,
        ...result,
    })
} catch {
    console.error(
        '[docs] Local content release verification failed; no remote state changed.'
    )
    process.exitCode = 1
}
