import Image from 'next/image'
import Link from 'next/link'
import { UIUX_FALLBACK_IMAGES, type UiUxDoc } from './uiux-hub.types'

export function UiUxHubNewsletterSection({
    tutorial,
    tutorialLabel,
    newsletterTitle,
    newsletterDescription,
    newsletterPlaceholder,
    newsletterButton,
    isKorean,
}: {
    tutorial: UiUxDoc
    tutorialLabel: string
    newsletterTitle: string
    newsletterDescription: string
    newsletterPlaceholder: string
    newsletterButton: string
    isKorean: boolean
}) {
    return (
        <section className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <Link
                href={tutorial.href}
                className="ds-card group relative min-h-104 overflow-hidden bg-surface-container-lowest"
            >
                <div className="absolute inset-0">
                    <Image
                        src={
                            tutorial.thumbnail ?? UIUX_FALLBACK_IMAGES.tutorial
                        }
                        alt={tutorial.title}
                        fill
                        className="object-cover opacity-65 transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-white via-white/75 to-white/30" />
                </div>
                <div className="relative flex h-full flex-col justify-end p-6 sm:p-8">
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-outline">
                        {tutorialLabel}
                    </p>
                    <h2 className="mt-4 max-w-[15ch] text-3xl font-bold leading-[1.05] tracking-[-0.05em] text-on-surface">
                        {tutorial.title}
                    </h2>
                </div>
            </Link>

            <section className="ds-card flex min-w-0 flex-col justify-center bg-zinc-950 p-8 text-zinc-50 sm:min-h-104 sm:p-10 lg:px-12">
                <div className="mb-6 h-1 w-16 bg-primary" />
                <h2
                    className={[
                        'w-full max-w-none whitespace-normal text-4xl font-bold text-white [overflow-wrap:normal] [word-break:keep-all]',
                        isKorean
                            ? 'break-keep leading-[1.18] tracking-[-0.03em]'
                            : 'leading-[1.04] tracking-[-0.04em]',
                    ].join(' ')}
                >
                    {newsletterTitle}
                </h2>
                <p
                    className={[
                        'mt-5 w-full max-w-none whitespace-normal text-sm text-white/72 [overflow-wrap:normal] sm:text-base',
                        isKorean ? 'break-keep leading-7' : 'leading-7',
                    ].join(' ')}
                >
                    {newsletterDescription}
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <input
                        className="min-h-14 min-w-0 flex-1 border border-white/12 bg-white/6 px-4 text-sm text-white placeholder:text-white/40"
                        placeholder={newsletterPlaceholder}
                    />
                    <button className="min-h-14 w-full min-w-0 bg-white px-5 text-[0.72rem] font-semibold tracking-[0.16em] text-zinc-950 uppercase transition-opacity hover:opacity-90 sm:w-auto sm:min-w-40 sm:tracking-[0.2em]">
                        {newsletterButton}
                    </button>
                </div>
            </section>
        </section>
    )
}
