import Link from 'next/link'

type DocsSearchPanelProps = {
    keyword?: string
    eyebrow: string
    title: string
    description: string
    placeholder: string
    submitLabel: string
    recommendations: readonly string[]
    resultCount?: string
}

export function DocsSearchPanel({
    keyword,
    eyebrow,
    title,
    description,
    placeholder,
    submitLabel,
    recommendations,
    resultCount,
}: DocsSearchPanelProps) {
    return (
        <section className="ds-panel overflow-hidden p-5 sm:p-6 lg:p-7">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)] lg:items-end">
                <div className="space-y-3">
                    <p className="text-xs font-semibold tracking-[0.2em] text-outline uppercase">
                        {eyebrow}
                    </p>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl lg:text-4xl">
                            {title}
                        </h1>
                        <p className="max-w-2xl text-sm leading-7 text-on-surface-variant sm:text-base">
                            {description}
                        </p>
                    </div>
                    {resultCount && (
                        <span className="inline-flex rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
                            {resultCount}
                        </span>
                    )}
                </div>

                <div className="space-y-3">
                    <form
                        action="/docs"
                        className="flex overflow-hidden rounded-2xl border border-border bg-surface-container-lowest p-1.5 focus-within:border-primary/60 focus-within:shadow-glow-primary"
                    >
                        <input
                            name="q"
                            type="search"
                            defaultValue={keyword}
                            placeholder={placeholder}
                            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-on-surface outline-none placeholder:text-outline"
                        />
                        <button
                            type="submit"
                            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-fixed"
                        >
                            {submitLabel}
                        </button>
                    </form>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {recommendations.map((term) => (
                            <Link
                                key={term}
                                href={`/docs?q=${encodeURIComponent(term)}`}
                                className="shrink-0 rounded-full border border-border bg-surface-container px-3 py-1.5 text-xs font-medium text-on-surface-variant transition hover:border-primary/50 hover:text-primary"
                            >
                                {term}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
