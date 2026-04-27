import Link from 'next/link'

const principles = [
    {
        title: 'Technical precision',
        description:
            'The goal is not just to ship code, but to understand the system boundaries, tradeoffs, and failure modes behind it.',
    },
    {
        title: 'Useful depth',
        description:
            'Notes are written to be practical. Deep dives should still help with real implementation decisions.',
    },
    {
        title: 'Readable systems thinking',
        description:
            'Complex topics become more valuable when they are structured clearly enough to revisit and reuse later.',
    },
]

const lanes = [
    {
        name: 'Feed',
        href: '/feed',
        summary: 'A rolling stream of the newest documents and working notes.',
    },
    {
        name: 'Web',
        href: '/web',
        summary: 'Frontend systems, frameworks, browsers, and runtime details.',
    },
    {
        name: 'Mobile',
        href: '/mobile',
        summary: 'A dedicated lane for device-aware UX and mobile constraints.',
    },
    {
        name: 'UI/UX',
        href: '/ui-ux',
        summary: 'Accessibility, interaction quality, and interface craft.',
    },
]

export default function Page() {
    return (
        <main className="docs-shell px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <div className="space-y-8">
                <section className="relative overflow-hidden rounded-xl border border-white/8 bg-surface-container-lowest/80 p-6 sm:p-8">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.14),transparent_30%)]" />
                    <div className="relative space-y-4">
                        <p className="font-display text-label-md uppercase text-cyan-400">
                            About
                        </p>
                        <h1 className="font-display text-headline-xl text-on-surface">
                            HeapForge is a place to turn technical curiosity
                            into durable knowledge.
                        </h1>
                        <p className="max-w-3xl text-body-lg text-on-surface-variant">
                            The writing here sits between software
                            craftsmanship, systems thinking, and UI detail. Some
                            entries are deep dives, some are working notes, and
                            some exist to capture patterns worth reusing.
                        </p>
                    </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-3">
                    {principles.map((principle) => (
                        <article
                            key={principle.title}
                            className="ds-card bg-surface-container-low p-5"
                        >
                            <h2 className="font-display text-headline-md text-on-surface">
                                {principle.title}
                            </h2>
                            <p className="mt-2 text-body-md text-on-surface-variant">
                                {principle.description}
                            </p>
                        </article>
                    ))}
                </section>

                <section className="ds-card bg-surface-container-low p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="font-display text-label-md uppercase text-cyan-400">
                                Sections
                            </p>
                            <h2 className="font-display text-headline-lg text-on-surface">
                                Explore the main content lanes
                            </h2>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                        {lanes.map((lane) => (
                            <Link
                                key={lane.name}
                                href={lane.href}
                                className="rounded-lg border border-outline-variant bg-surface-container p-4 transition-colors hover:border-cyan-400/60"
                            >
                                <h3 className="font-display text-xl text-on-surface">
                                    {lane.name}
                                </h3>
                                <p className="mt-2 text-body-md text-on-surface-variant">
                                    {lane.summary}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    )
}
