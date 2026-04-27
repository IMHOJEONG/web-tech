import { HubPage } from '~/components/content-hub/hub-page'
import { getHubDocs } from '~/lib/content-hubs'

export default function Page() {
    const docs = getHubDocs('web')

    return (
        <HubPage
            eyebrow="Web"
            title="Frontend systems, browser behavior, and framework mechanics."
            description="A focused space for React, Next.js, rendering models, runtime internals, and the practical tradeoffs of building for the web."
            stats={[
                { label: 'Entries', value: String(docs.length) },
                { label: 'Primary stack', value: 'React / Next.js' },
                { label: 'Focus', value: 'Runtime + UI' },
            ]}
            docs={docs}
            panels={[
                {
                    title: 'Framework internals',
                    description:
                        'How application frameworks are assembled, where abstractions leak, and what that means in day-to-day code.',
                    items: [
                        'Next.js package structure',
                        'Routing behavior',
                        'Composition patterns',
                    ],
                },
                {
                    title: 'Browser understanding',
                    description:
                        'Deeper reading on the engine and rendering pipeline that shapes frontend performance and mental models.',
                    items: [
                        'V8 bytecode',
                        'Execution pipeline',
                        'Rendering mechanics',
                    ],
                },
                {
                    title: 'Practical engineering',
                    description:
                        'Production questions tend to sit between theory and UI implementation, so the notes here stay very applied.',
                    items: [
                        'Performance tradeoffs',
                        'Component design',
                        'Developer ergonomics',
                    ],
                },
            ]}
            emptyTitle="Web notes are being assembled."
            emptyDescription="This hub will grow with frontend architecture notes, browser internals, and framework deep-dives."
        />
    )
}
