import { HubPage } from '~/components/content-hub/hub-page'
import { getHubDocs } from '~/lib/content-hubs'

export default function Page() {
    const docs = getHubDocs('mobile')

    return (
        <HubPage
            eyebrow="Mobile"
            title="A dedicated lane for native UX, device constraints, and interaction quality."
            description="This section is reserved for mobile-first patterns, platform APIs, performance constraints, and cross-device product thinking."
            stats={[
                { label: 'Entries', value: String(docs.length) },
                { label: 'Status', value: 'Preparing' },
                { label: 'Priority', value: 'Roadmap' },
            ]}
            docs={docs}
            panels={[
                {
                    title: 'Planned topics',
                    description:
                        'The first set of writing in this lane will focus on practical design and implementation tradeoffs.',
                    items: [
                        'Touch interaction patterns',
                        'Responsive information density',
                        'App shell performance',
                    ],
                },
                {
                    title: 'Why a separate hub',
                    description:
                        'Mobile constraints change architecture, state handling, and interface priorities enough to deserve their own space.',
                    items: [
                        'Battery and memory budgets',
                        'Navigation ergonomics',
                        'Network-sensitive UX',
                    ],
                },
                {
                    title: 'What comes next',
                    description:
                        'As entries are published, this page will turn from a roadmap into a proper index for mobile notes.',
                    items: [
                        'First case studies',
                        'Pattern reviews',
                        'Platform-specific notes',
                    ],
                },
            ]}
            emptyTitle="No mobile entries yet."
            emptyDescription="The page is live now, and the first mobile-focused documents can land here without needing another navigation change."
        />
    )
}
