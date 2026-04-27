import { HubPage } from '~/components/content-hub/hub-page'
import { getHubDocs } from '~/lib/content-hubs'

export default function Page() {
    const docs = getHubDocs('uiux')

    return (
        <HubPage
            eyebrow="UI/UX"
            title="Interaction detail, accessibility, and interface refinement."
            description="This hub collects notes where component behavior, semantics, motion, and readability matter as much as the implementation itself."
            stats={[
                { label: 'Entries', value: String(docs.length) },
                { label: 'Focus', value: 'Accessibility' },
                { label: 'Mode', value: 'Design + code' },
            ]}
            docs={docs}
            panels={[
                {
                    title: 'Accessibility first',
                    description:
                        'Interface polish without semantics is fragile. This stream gives equal weight to usability, correctness, and implementation.',
                    items: [
                        'ARIA behavior',
                        'Focus management',
                        'Accessible interaction flows',
                    ],
                },
                {
                    title: 'Component craft',
                    description:
                        'Small details often decide whether a UI feels calm and robust or noisy and fragile.',
                    items: [
                        'Drawer and modal patterns',
                        'Visual hierarchy',
                        'Feedback states',
                    ],
                },
                {
                    title: 'Design system thinking',
                    description:
                        'The best UI/UX work tends to show up as repeatable tokens, rules, and interaction decisions.',
                    items: [
                        'Token decisions',
                        'Reusable patterns',
                        'Readable defaults',
                    ],
                },
            ]}
            emptyTitle="UI/UX notes are just getting started."
            emptyDescription="As accessibility and component-craft write-ups grow, they will be collected here as a dedicated stream."
        />
    )
}
