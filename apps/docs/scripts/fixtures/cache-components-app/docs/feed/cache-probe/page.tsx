import { connection } from 'next/server'
import { fetchRemoteDocByRoutePath } from '~/lib/content-api'

// Only the known HTML fixture from the loopback origin is rendered here.
export default async function Page() {
    await connection()
    const document = await fetchRemoteDocByRoutePath('feed/cache-probe')
    return (
        <article
            dangerouslySetInnerHTML={{ __html: document?.content ?? '' }}
        />
    )
}
