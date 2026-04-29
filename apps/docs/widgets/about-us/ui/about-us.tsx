import { ArrowUpRight, Github, Twitter } from 'lucide-react'

const pillarCards = [
    {
        eyebrow: 'ENGINEERING PHILOSOPHY',
        title: 'Web & Performance',
        description:
            "Deep dives into React, Rust, and the future of the V8 engine. We don't just write code; we architect experiences that scale with mathematical certainty.",
        tone: 'secondary',
    },
    {
        eyebrow: 'MOBILITY',
        title: 'Mobile Fluidity',
        description:
            'Mastering the nuances of native and cross-platform ecosystems to build seamless handheld tools.',
        tone: 'primary',
        terminal: ['const mobile = await optimize(ui,', 'stack);'],
    },
    {
        eyebrow: 'INTERFACE DESIGN',
        title: 'UI/UX as Code',
        description:
            'Design systems are living entities. We explore the systematic approach to visual hierarchy, motion patterns, and accessibility that transforms a generic interface into a precision instrument.',
        tone: 'muted',
    },
]

function PillBadge({
    label,
    tone,
}: {
    label: string
    tone: 'primary' | 'secondary' | 'muted'
}) {
    const className =
        tone === 'primary'
            ? 'bg-primary/10 text-primary'
            : tone === 'secondary'
              ? 'bg-secondary/15 text-secondary'
              : 'bg-surface-container text-on-surface-variant'

    return (
        <div
            className={`font-display inline-flex rounded-full px-3 py-1 text-xs uppercase ${className}`}
        >
            {label}
        </div>
    )
}

export function AboutUs() {
    const webCard = pillarCards[0]!
    const mobileCard = pillarCards[1]!
    const designCard = pillarCards[2]!

    return (
        <main className="w-full bg-[linear-gradient(180deg,var(--background)_0%,var(--surface-container-lowest)_100%)] text-on-surface">
            <div className="mx-auto flex w-full max-w-page flex-col gap-24 px-4 pb-24 pt-32 sm:px-8">
                <section className="flex flex-col gap-10 border-b border-border pb-12 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-[42rem] space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                            <span className="size-2 rounded-full bg-current" />
                            <span className="font-display text-sm font-medium tracking-[0.05em] uppercase">
                                STATUS: LIVE // VERSION 2.0.4
                            </span>
                        </div>

                        <h1 className="font-display max-w-[30rem] text-[clamp(2.75rem,6vw,4.75rem)] leading-[1.05] font-bold tracking-[-0.04em] text-on-surface">
                            BRIDGING THE STACK THROUGH{' '}
                            <span className="text-secondary">TECHNICAL</span>{' '}
                            <span className="text-secondary">PRECISION</span>
                        </h1>

                        <p className="max-w-[36rem] text-body-lg text-on-surface-variant">
                            A digital lab dedicated to unraveling the
                            complexities of modern engineering. We explore the
                            intersection where Web performance, Mobile fluidity,
                            and UI/UX architecture converge.
                        </p>
                    </div>

                    <div className="font-mono text-sm leading-[1.5] text-outline">
                        <p>{'// MISSION_STATEMENT.md'}</p>
                        <p>{'// ESTABLISHED_2024'}</p>
                    </div>
                </section>

                <section className="grid grid-cols-12 gap-6">
                    <article className="ds-card col-span-12 flex min-h-[22rem] flex-col justify-between rounded-lg bg-surface-container-low p-12 lg:col-span-8">
                        <div className="space-y-4">
                            <PillBadge label={webCard.eyebrow} tone="secondary" />
                            <h2 className="font-display text-headline-lg text-on-surface">
                                {webCard.title}
                            </h2>
                            <p className="max-w-[32rem] text-body-md text-on-surface-variant">
                                {webCard.description}
                            </p>
                        </div>

                        <div className="flex items-center gap-4 text-primary">
                            <ArrowUpRight className="size-6" />
                            <Github className="size-5 text-outline" />
                        </div>
                    </article>

                    <article className="ds-card col-span-12 flex min-h-[22rem] flex-col justify-between rounded-lg bg-surface-container-low p-12 lg:col-span-4">
                        <div className="space-y-4">
                            <PillBadge label={mobileCard.eyebrow} tone="primary" />
                            <h2 className="font-display text-headline-md text-on-surface">
                                {mobileCard.title}
                            </h2>
                            <p className="text-body-md text-on-surface-variant">
                                {mobileCard.description}
                            </p>
                        </div>

                        <div className="rounded-sm border border-border bg-surface-container p-4 font-mono text-xs leading-4 text-secondary">
                            <p>{mobileCard.terminal?.[0]}</p>
                            <p>{mobileCard.terminal?.[1]}</p>
                        </div>
                    </article>

                    <article className="ds-card col-span-12 grid min-h-[19rem] rounded-lg bg-surface-container-low p-12 lg:grid-cols-[1.4fr_0.9fr] lg:items-center lg:gap-8">
                        <div className="space-y-4">
                            <PillBadge label={designCard.eyebrow} tone="muted" />
                            <h2 className="font-display text-headline-lg text-on-surface">
                                {designCard.title}
                            </h2>
                            <p className="max-w-[42rem] text-body-md text-on-surface-variant">
                                {designCard.description}
                            </p>
                        </div>

                        <div className="mt-8 overflow-hidden rounded-sm border border-border lg:mt-0">
                            <div className="aspect-[16/9] bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_35%),linear-gradient(135deg,color-mix(in_srgb,var(--surface-bright)_90%,transparent),color-mix(in_srgb,var(--surface-container)_82%,transparent))]" />
                        </div>
                    </article>
                </section>

                <section className="grid gap-16 pt-8 lg:grid-cols-2">
                    <article className="ds-card relative rounded-lg bg-surface-container p-8 shadow-glow-primary">
                        <div className="space-y-8">
                            <div className="flex items-center gap-6">
                                <div className="flex size-20 items-center justify-center rounded-xl border-2 border-primary bg-[linear-gradient(135deg,var(--surface-container-low),var(--surface-container-high))] text-2xl font-bold text-primary">
                                    AV
                                </div>
                                <div className="space-y-1">
                                    <h2 className="font-display text-[1.5rem] leading-[1.3] font-bold text-on-surface">
                                        Alex Volkov
                                    </h2>
                                    <p className="font-display text-base tracking-[0.05em] uppercase text-primary">
                                        LEAD ARCHITECT & CREATOR
                                    </p>
                                </div>
                            </div>

                            <p className="text-body-md text-on-surface-variant">
                                A full-stack engineer with a penchant for minimal
                                aesthetics and maximal performance. Building
                                TECH_LOGIC as an open-source knowledge base for
                                the next generation of digital builders.
                            </p>

                            <div className="flex flex-wrap gap-4">
                                <a
                                    href="#"
                                    className="inline-flex items-center gap-2 rounded-sm border border-outline-variant bg-surface-container-low px-4 py-2 text-sm text-on-surface transition-colors hover:border-primary hover:text-primary"
                                >
                                    <Github className="size-4" />
                                    GITHUB
                                </a>
                                <a
                                    href="#"
                                    className="inline-flex items-center gap-2 rounded-sm border border-outline-variant bg-surface-container-low px-4 py-2 text-sm text-on-surface transition-colors hover:border-primary hover:text-primary"
                                >
                                    <Twitter className="size-4" />
                                    TWITTER/X
                                </a>
                            </div>
                        </div>
                    </article>

                    <section className="space-y-12">
                        <div className="border-l-4 border-primary pl-7">
                            <h2 className="font-display text-headline-lg text-on-surface">
                                INITIATE CONTACT
                            </h2>
                            <p className="mt-2 text-body-md text-on-surface-variant">
                                Have a proposal or a technical inquiry? Send a
                                packet below.
                            </p>
                        </div>

                        <form className="space-y-8">
                            <div className="grid gap-8 md:grid-cols-2">
                                <label className="space-y-2">
                                    <span className="font-display text-xs tracking-[0.1em] uppercase text-outline">
                                        SENDER_NAME
                                    </span>
                                    <input
                                        className="w-full border-b border-outline-variant bg-surface-container-lowest px-3 py-4 text-base text-on-surface outline-none transition-colors focus:border-primary"
                                        placeholder="e.g. John Doe"
                                    />
                                </label>
                                <label className="space-y-2">
                                    <span className="font-display text-xs tracking-[0.1em] uppercase text-outline">
                                        RETURN_ADDRESS
                                    </span>
                                    <input
                                        className="w-full border-b border-outline-variant bg-surface-container-lowest px-3 py-4 text-base text-on-surface outline-none transition-colors focus:border-primary"
                                        placeholder="email@provider.com"
                                    />
                                </label>
                            </div>

                            <label className="space-y-2">
                                <span className="font-display text-xs tracking-[0.1em] uppercase text-outline">
                                    PAYLOAD_DESCRIPTION
                                </span>
                                <textarea
                                    className="min-h-32 w-full border-b border-outline-variant bg-surface-container-lowest px-3 py-4 text-base text-on-surface outline-none transition-colors focus:border-primary"
                                    placeholder="Briefly describe your inquiry..."
                                />
                            </label>

                            <button
                                type="button"
                                className="inline-flex items-center justify-center bg-primary-container px-12 py-4 font-display text-base tracking-[0.1em] text-on-primary-container uppercase shadow-glow-primary transition-transform hover:-translate-y-0.5"
                            >
                                EXECUTE SEND
                            </button>
                        </form>
                    </section>
                </section>
            </div>
        </main>
    )
}
