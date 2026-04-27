import { HubPage } from '~/components/content-hub/hub-page'
import { getHubDocs } from '~/lib/content-hubs'

export default function Page() {
    const docs = getHubDocs('feed')

    return (
        <HubPage
            eyebrow="Feed"
            title="Latest notes, experiments, and technical write-ups."
            description="A running stream of engineering notes across systems, frontend architecture, accessibility, and implementation detail."
            stats={[
                { label: 'Entries', value: String(docs.length) },
                { label: 'Updated', value: docs[0]?.date ?? 'Ongoing' },
                { label: 'Scope', value: 'Cross-domain' },
            ]}
            docs={docs}
            panels={[
                {
                    title: 'What lands here',
                    description:
                        'Fresh writing, working notes, and production-adjacent investigations show up here first.',
                    items: [
                        'Implementation notes',
                        'Architecture write-ups',
                        'Performance and accessibility fixes',
                    ],
                },
                {
                    title: 'Reading pattern',
                    description:
                        'This page works as the main inbox for new content before it settles into deeper topic hubs.',
                    items: [
                        'Newest entries first',
                        'Skimmable summaries',
                        'Direct links into full docs',
                    ],
                },
                {
                    title: 'Good next stops',
                    description:
                        'If you want a narrower lens after scanning the feed, jump into focused topic hubs.',
                    items: ['Web', 'UI/UX', 'Category browser'],
                },
            ]}
            emptyTitle="The feed is still warming up."
            emptyDescription="As new entries are published, they will appear here in reverse chronological order."
        />
    )
}
