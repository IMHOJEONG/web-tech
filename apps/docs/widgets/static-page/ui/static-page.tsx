import { MainContent } from '~/shared/ui/main-content'

type StaticPageSection = {
    id: string
    title: string
    body: string
}

type StaticPageProps = {
    eyebrow: string
    title: string
    description: string
    sections: StaticPageSection[]
}

export function StaticPage({
    eyebrow,
    title,
    description,
    sections,
}: StaticPageProps) {
    return (
        <MainContent className="mx-auto flex w-full max-w-3xl flex-1 px-4 pb-12 pt-10 sm:px-6 sm:pt-12 lg:px-8 lg:pt-14">
            <section className="w-full min-w-0">
                <header className="space-y-3 border-b border-outline-variant/70 pb-6">
                    <p className="font-display text-xs tracking-[0.16em] text-primary uppercase">
                        {eyebrow}
                    </p>
                    <div className="space-y-2">
                        <h1 className="font-display text-3xl leading-tight font-semibold text-on-surface sm:text-4xl">
                            {title}
                        </h1>
                        <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                            {description}
                        </p>
                    </div>
                </header>

                <div className="divide-y divide-outline-variant/70">
                    {sections.map((section) => (
                        <article key={section.id} className="py-5 first:pt-6">
                            <h2 className="font-display text-lg font-semibold text-on-surface">
                                {section.title}
                            </h2>
                            <p className="mt-2 text-sm leading-7 text-muted-foreground">
                                {section.body}
                            </p>
                        </article>
                    ))}
                </div>
            </section>
        </MainContent>
    )
}
