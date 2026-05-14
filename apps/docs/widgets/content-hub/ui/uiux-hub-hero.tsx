export function UiUxHubHero({
    eyebrow,
    titleLineOne,
    titleLineTwo,
    description,
}: {
    eyebrow: string
    titleLineOne: string
    titleLineTwo: string
    description: string
}) {
    return (
        <section className="pl-5 md:pl-8">
            <div className="max-w-5xl border-l-2 border-on-surface pl-5 md:pl-8">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-outline">
                    {eyebrow}
                </p>
                <div className="mt-4 space-y-2">
                    <h1 className="font-display text-4xl leading-none font-bold tracking-[-0.05em] text-on-surface sm:text-5xl lg:text-6xl">
                        {titleLineOne}
                    </h1>
                    <p className="font-display text-4xl leading-none font-bold tracking-[-0.05em] text-outline sm:text-5xl lg:text-6xl">
                        {titleLineTwo}
                    </p>
                </div>
                <p className="mt-5 max-w-3xl text-sm leading-7 text-on-surface-variant sm:text-base">
                    {description}
                </p>
            </div>
        </section>
    )
}
