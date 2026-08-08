import Link from 'next/link'

type StaticPageSection = {
    id: string
    title: string
    body: string
}

type StaticPageAsideLink = {
    href: string
    label: string
    external?: boolean
}

type StaticPageProps = {
    eyebrow: string
    title: string
    description: string
    sections: StaticPageSection[]
    asideTitle: string
    asideBody: string
    asideLink?: StaticPageAsideLink
}

export function StaticPage({
    eyebrow,
    title,
    description,
    sections,
    asideTitle,
    asideBody,
    asideLink,
}: StaticPageProps) {
    return (
        <main className="mx-auto flex w-full max-w-page flex-1 px-4 pb-20 pt-24 sm:px-6 lg:px-8">
            <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12">
                <section className="space-y-8">
                    <header className="space-y-4 border-b border-outline-variant/70 pb-8">
                        <p className="font-display text-xs tracking-[0.22em] text-primary uppercase">
                            {eyebrow}
                        </p>
                        <div className="space-y-3">
                            <h1 className="font-display text-4xl leading-tight font-semibold text-on-surface sm:text-5xl">
                                {title}
                            </h1>
                            <p className="max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
                                {description}
                            </p>
                        </div>
                    </header>

                    <div className="space-y-6">
                        {sections.map((section) => (
                            <article
                                key={section.id}
                                className="rounded-3xl border border-outline-variant/70 bg-surface-container-low px-6 py-6 shadow-sm sm:px-8"
                            >
                                <h2 className="font-display text-xl tracking-[0.08em] text-on-surface uppercase">
                                    {section.title}
                                </h2>
                                <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
                                    {section.body}
                                </p>
                            </article>
                        ))}
                    </div>
                </section>

                <aside className="h-fit rounded-3xl border border-outline-variant/70 bg-surface-container px-6 py-6 shadow-sm lg:sticky lg:top-28">
                    <h2 className="font-display text-sm tracking-[0.2em] text-on-surface uppercase">
                        {asideTitle}
                    </h2>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                        {asideBody}
                    </p>
                    {asideLink ? (
                        <Link
                            href={asideLink.href}
                            target={asideLink.external ? '_blank' : undefined}
                            rel={
                                asideLink.external
                                    ? 'noreferrer noopener'
                                    : undefined
                            }
                            className="mt-6 inline-flex items-center font-display text-xs tracking-[0.18em] text-primary uppercase transition-colors hover:text-primary/80"
                        >
                            {asideLink.label}
                        </Link>
                    ) : null}
                </aside>
            </div>
        </main>
    )
}
