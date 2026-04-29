import Link from 'next/link'

const imgAuthorProfile =
    'http://localhost:3845/assets/9883d61216c94307ecd4202521c147ae585a6902.png'
const imgAbstractTechnologyHero =
    'http://localhost:3845/assets/b380afb3118d9ce236034c24a046e94c837e80a0.png'
const imgDesignDetail1 =
    'http://localhost:3845/assets/ce95727877f35eaee57e9743aafa602fc7016358.png'
const imgDesignDetail2 =
    'http://localhost:3845/assets/ea415ff9f811cbf03199c1d86283ed2fc70606ba.png'
const imgMobileInterfaceMockup =
    'http://localhost:3845/assets/3558d689791f4d286eb7f8da187223fd3d922065.png'

const tocItems = [
    '01. The Reactivity Paradox',
    '02. Logic & Stream Primitives',
    '03. Visual Refinement',
    '04. The Mobile Delta',
    '05. Summary & Benchmarks',
]

const relatedSignals = [
    {
        category: 'MOBILE',
        title: 'Optimizing Rust compilation for ARM architectures',
        meta: 'MAY 12 • 08 MIN',
        href: '/mobile',
    },
    {
        category: 'UI/UX',
        title: 'The ethics of algorithmic visual feedback',
        meta: 'MAY 08 • 15 MIN',
        href: '/ui-ux',
    },
    {
        category: 'WEB',
        title: 'Beyond HTTP/3: The future of data transport',
        meta: 'APR 29 • 20 MIN',
        href: '/web',
    },
]

const pageMeta = {
    web: {
        badge: 'WEB DEVELOPMENT',
        note: 'A technical field guide for frontend systems and runtime-aware interfaces.',
    },
    mobile: {
        badge: 'MOBILE SYSTEMS',
        note: 'A high-density article template for touch-first product thinking and mobile runtime constraints.',
    },
    uiux: {
        badge: 'UI/UX SYSTEMS',
        note: 'A design-technical reading format for interaction semantics, hierarchy, motion, and accessible component craft.',
    },
} as const

type ArticleDetailProps = {
    channel: keyof typeof pageMeta
}

function SidebarSection({
    title,
    children,
}: {
    title: string
    children: React.ReactNode
}) {
    return (
        <section className="space-y-4">
            <p className="font-display text-[0.625rem] leading-[0.9375rem] tracking-[0.2em] text-outline uppercase">
                {title}
            </p>
            {children}
        </section>
    )
}

export function ArticleDetail({ channel }: ArticleDetailProps) {
    const meta = pageMeta[channel]

    return (
        <main className="w-full text-on-surface">
            <div className="mx-auto h-0.5 max-w-page">
                <div className="h-full w-1/3 bg-primary shadow-[0_0_10px_rgba(0,220,229,0.5)]" />
            </div>

            <div className="mx-auto grid w-full max-w-page gap-8 px-4 pb-20 pt-32 sm:px-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
                <article className="min-w-0 space-y-12">
                    <section className="space-y-6">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-sm bg-secondary/15 px-3 py-1 font-display text-xs tracking-[0.05em] text-secondary uppercase">
                                {meta.badge}
                            </span>
                            <span className="text-on-surface-variant">•</span>
                            <span className="font-display text-xs tracking-[0.05em] text-outline uppercase">
                                12 MIN READ
                            </span>
                        </div>

                        <div className="space-y-6">
                            <h1 className="font-display max-w-[15ch] text-[clamp(2.4rem,5vw,4rem)] leading-[1.15] font-bold tracking-[-0.03em] text-on-surface">
                                Architecting the Next Generation of Real-time
                                Reactive Interfaces
                            </h1>

                            <div className="flex items-center gap-4">
                                <div className="overflow-hidden rounded-xl border border-border bg-surface-container size-12">
                                    <img
                                        src={imgAuthorProfile}
                                        alt="Alex Rivers profile"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div>
                                    <p className="font-display text-base text-on-surface">
                                        Alex Rivers
                                    </p>
                                    <p className="font-display text-sm tracking-[0.08em] text-outline uppercase">
                                        LEAD ENGINEER • MAY 24, 2024
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-sm border border-border bg-surface-container-lowest">
                        <div className="relative aspect-[16/9]">
                            <img
                                src={imgAbstractTechnologyHero}
                                alt="Abstract technology hero"
                                className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
                        </div>
                    </section>

                    <section className="space-y-6 text-body-lg text-on-surface-variant">
                        <p>
                            The transition from static data fetching to granular
                            reactivity represents a paradigm shift in how we
                            conceive digital interactions. As we push the
                            boundaries of low-latency applications, the
                            infrastructure supporting these experiences must
                            evolve beyond traditional state management patterns.
                        </p>

                        <div className="space-y-4 pt-4">
                            <h2 className="font-display text-headline-lg text-on-surface">
                                The Reactivity Paradox
                            </h2>
                            <p>
                                In modern web architecture, we often find
                                ourselves fighting the framework to achieve the
                                level of precision required for high-density
                                information displays. The core challenge lies in
                                minimizing the re-render footprint while
                                maintaining a declarative mental model.
                            </p>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-sm border border-white/10 bg-black">
                        <div className="flex items-center justify-between border-b border-white/5 bg-surface-container px-3 py-1.5">
                            <span className="font-display text-[0.625rem] tracking-[0.14em] text-outline uppercase">
                                REACTIVE_STREAM.TS
                            </span>
                            <span className="font-mono text-xs text-outline">
                                COPY
                            </span>
                        </div>
                        <pre className="overflow-x-auto px-6 py-10 font-mono text-sm leading-[1.5] text-zinc-200">
                            <code>{`async function initializeNode(id: string) {
  // Initialize high-frequency stream
  const stream = await connectToRegistry(id);

  return stream.pipe(
    filter(data => data.priority > 0.8),
    map(transformData),
    tap(uiRegistry.update)
  );
}

// Precision observer hook
const useReactiveState = (stream$) => {
  const [state, setState] = useState([]);
  // Implementation details...
}`}</code>
                        </pre>
                    </section>

                    <section className="space-y-6 text-body-lg text-on-surface-variant">
                        <p>
                            By leveraging stream-based state primitives,
                            developers can bypass the overhead of virtual DOM
                            reconciliation for data-heavy components like
                            real-time terminal outputs or financial dashboards.
                        </p>

                        <div className="space-y-4 pt-4">
                            <h2 className="font-display text-headline-lg text-on-surface">
                                Visual Refinement in High-Density Environments
                            </h2>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                            <div className="overflow-hidden rounded-sm border border-border bg-surface-container">
                                <img
                                    src={imgDesignDetail1}
                                    alt="Design detail with red accents"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div className="overflow-hidden rounded-sm border border-border bg-surface-container">
                                <img
                                    src={imgDesignDetail2}
                                    alt="Design detail with metallic lighting"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <h2 className="font-display text-headline-lg text-on-surface">
                                The Mobile Delta
                            </h2>
                        </div>

                        <div className="rounded-lg border border-border bg-surface-container-low p-8">
                            <div className="mx-auto max-w-[16rem] overflow-hidden rounded-[3rem] border-8 border-zinc-900 bg-black shadow-deep">
                                <div className="relative aspect-[256/500]">
                                    <img
                                        src={imgMobileInterfaceMockup}
                                        alt="Mobile interface mockup"
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute left-1/2 top-0 h-6 w-24 -translate-x-1/2 rounded-b-2xl bg-zinc-900" />
                                </div>
                            </div>
                        </div>

                        <p>
                            The mobile experience requires a different set of
                            constraints. Here, the precision engineered
                            aesthetic is not just a visual choice but a
                            functional necessity for maintaining clarity on
                            smaller viewports.
                        </p>
                    </section>

                    <section className="border-t border-border pt-8">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                            <div className="overflow-hidden rounded-full border border-border bg-surface-container size-12 shrink-0">
                                <img
                                    src={imgAuthorProfile}
                                    alt="Alex Rivers portrait"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div className="space-y-2">
                                <p className="font-display text-sm text-on-surface">
                                    About Alex Rivers
                                </p>
                                <p className="max-w-2xl text-sm leading-6 text-on-surface-variant">
                                    Engineering the intersection of high
                                    performance application logic, information
                                    density, and product feel. {meta.note}
                                </p>
                                <div className="flex flex-wrap gap-4 font-display text-xs tracking-[0.08em] uppercase">
                                    <Link href="/about" className="text-primary">
                                        TWITTER
                                    </Link>
                                    <Link href="/about" className="text-primary">
                                        GITHUB
                                    </Link>
                                    <Link href="/about" className="text-primary">
                                        LINKEDIN
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                </article>

                <aside className="space-y-8 xl:sticky xl:top-28 xl:self-start">
                    <SidebarSection title="TABLE OF CONTENTS">
                        <div className="space-y-3">
                            {tocItems.map((item, index) => (
                                <div
                                    key={item}
                                    className={
                                        index === 0
                                            ? 'font-display text-base text-primary'
                                            : 'font-display text-base text-outline'
                                    }
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                    </SidebarSection>

                    <SidebarSection title="JOIN THE SYSTEM">
                        <div className="relative overflow-hidden rounded-sm border border-primary/20 bg-[#09090b] p-6">
                            <div className="absolute -right-10 -top-10 size-24 rounded-full bg-primary/10 blur-2xl" />
                            <div className="relative space-y-5">
                                <div className="space-y-2">
                                    <h3 className="font-display text-base text-zinc-100">
                                        Get engineering insights delivered to
                                        your terminal weekly.
                                    </h3>
                                </div>
                                <div className="space-y-2">
                                    <input
                                        className="w-full border border-zinc-700 bg-surface-container px-3 py-3 text-sm tracking-[0.05em] text-zinc-300 uppercase outline-none transition-colors focus:border-primary"
                                        placeholder="USER@DOMAIN.COM"
                                    />
                                    <button className="w-full bg-primary px-4 py-3 font-display text-sm tracking-[0.12em] text-primary-foreground uppercase transition-opacity hover:opacity-90">
                                        SUBSCRIBE
                                    </button>
                                </div>
                            </div>
                        </div>
                    </SidebarSection>

                    <SidebarSection title="RELATED SIGNALS">
                        <div className="space-y-2">
                            {relatedSignals.map((signal) => (
                                <Link
                                    key={signal.title}
                                    href={signal.href}
                                    className="block rounded-sm px-2 py-2 transition-colors hover:bg-surface-container-low"
                                >
                                    <div className="inline-flex rounded-sm bg-surface-container px-1.5 py-0.5 font-display text-[0.625rem] tracking-[0.08em] text-on-surface-variant uppercase">
                                        {signal.category}
                                    </div>
                                    <h3 className="mt-2 font-display text-base leading-[1.4] text-on-surface">
                                        {signal.title}
                                    </h3>
                                    <p className="mt-1 font-display text-[0.625rem] tracking-[0.1em] text-outline uppercase">
                                        {signal.meta}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </SidebarSection>
                </aside>
            </div>
        </main>
    )
}
