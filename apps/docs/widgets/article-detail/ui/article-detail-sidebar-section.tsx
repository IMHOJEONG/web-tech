export function ArticleDetailSidebarSection({
    title,
    children,
}: {
    title: string
    children: React.ReactNode
}) {
    return (
        <section className="space-y-4">
            <p className="font-display text-[0.625rem] leading-3.75 tracking-[0.2em] text-outline uppercase">
                {title}
            </p>
            {children}
        </section>
    )
}
