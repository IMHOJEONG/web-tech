import { readFile } from 'node:fs/promises'

const endpoint = process.env.DOCS_CONTENT_REVALIDATE_URL?.trim()
const tokenFile = process.env.DOCS_CONTENT_REVALIDATE_TOKEN_FILE?.trim()

if (!endpoint) {
    throw new Error('DOCS_CONTENT_REVALIDATE_URL is required.')
}

if (!tokenFile) {
    throw new Error('DOCS_CONTENT_REVALIDATE_TOKEN_FILE is required.')
}

const endpointUrl = new URL(endpoint)

if (
    endpointUrl.protocol !== 'https:' &&
    !['localhost', '127.0.0.1'].includes(endpointUrl.hostname)
) {
    throw new Error(
        'The revalidation endpoint must use HTTPS outside localhost.'
    )
}

const token = (await readFile(tokenFile, 'utf8')).trim()

if (!token) {
    throw new Error('The content revalidation token file is empty.')
}

const response = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
    },
    signal: AbortSignal.timeout(5_000),
})

if (!response.ok) {
    throw new Error(
        `Content cache revalidation failed with ${response.status}.`
    )
}

const payload = await response.json()

if (payload?.revalidated !== true) {
    throw new Error('Content cache revalidation returned an invalid response.')
}

console.info(
    `[docs] Remote content cache revalidated at ${payload.revalidatedAt ?? 'unknown time'}.`
)
