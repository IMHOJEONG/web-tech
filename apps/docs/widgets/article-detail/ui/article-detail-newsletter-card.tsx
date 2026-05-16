import type { NewsletterCardProps } from '~/widgets/article-detail/ui/article-detail.types'

export function ArticleDetailNewsletterCard({
    title,
    description,
    placeholder,
    buttonLabel,
    note,
    compact = false,
}: NewsletterCardProps) {
    return (
        <div className="ds-code-shell relative p-6">
            <div className="absolute -right-10 -top-10 size-24 rounded-full bg-primary/10 blur-2xl" />
            <div className="relative space-y-5">
                <div className="space-y-2">
                    <h3 className="font-display text-base text-on-surface">
                        {title}
                    </h3>
                    <p className="text-sm leading-5 text-on-surface-variant">
                        {description}
                    </p>
                </div>

                {compact ? (
                    <div className="space-y-2">
                        <input
                            className="ds-input w-full px-3 py-3 text-sm tracking-wider text-on-surface uppercase"
                            placeholder={placeholder}
                        />
                        <button className="ds-button-primary w-full px-4 py-3 text-sm tracking-[0.12em] uppercase">
                            {buttonLabel}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <input
                            className="ds-input w-full px-4 py-3 text-sm tracking-wider text-on-surface"
                            placeholder={placeholder}
                        />
                        <button className="ds-button-primary w-full px-4 py-3 text-sm tracking-[0.12em] uppercase">
                            {buttonLabel}
                        </button>
                        {note ? (
                            <p className="text-center font-display text-[0.625rem] tracking-[0.16em] text-outline uppercase">
                                {note}
                            </p>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    )
}
