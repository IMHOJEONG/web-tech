import { runPublicationCli } from './content-publication.ts'

try {
    await runPublicationCli(process.env, process.argv.slice(2))
} catch (error) {
    // Never print network causes, configured values, or response bodies.
    console.error(
        `[docs] ${error instanceof Error && error.constructor.name === 'PublicationError' ? error.message : 'Content publication command failed.'}`
    )
    process.exitCode = 1
}
