'use client'

import Link from 'next/link'

type ErrorBoxProps = {
    title: string
    description: string
    eyebrow?: string
    primaryLabel?: string
    onPrimaryAction?: () => void
    secondaryLabel?: string
    secondaryHref?: string
}

export function ErrorBox({
    title,
    description,
    eyebrow = '안내',
    primaryLabel,
    onPrimaryAction,
    secondaryLabel,
    secondaryHref = '/',
}: ErrorBoxProps) {
    return (
        <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col justify-center px-6 py-16">
            <div className="ds-panel space-y-5 px-6 py-8 sm:px-8 sm:py-10">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-(--hf-accent-strong)">
                    {eyebrow}
                </p>
                <div className="space-y-3">
                    <h1 className="text-3xl font-semibold tracking-tight text-(--hf-text-primary) sm:text-4xl">
                        {title}
                    </h1>
                    <p className="max-w-2xl break-keep text-base leading-7 text-(--hf-text-secondary)">
                        {description}
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                    {primaryLabel && onPrimaryAction ? (
                        <button
                            type="button"
                            onClick={onPrimaryAction}
                            className="ds-button-primary"
                        >
                            {primaryLabel}
                        </button>
                    ) : null}
                    {secondaryLabel ? (
                        <Link
                            href={secondaryHref}
                            className="ds-button-secondary"
                        >
                            {secondaryLabel}
                        </Link>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
