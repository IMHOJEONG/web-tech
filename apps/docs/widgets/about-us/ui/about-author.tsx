import { getTranslations } from 'next-intl/server'
import { FaGithub } from 'react-icons/fa'

export async function AboutAuthor() {
    const t = await getTranslations('about.profile')
    const githubHref = t('links.github.href')

    return (
        <section
            data-testid="about-author"
            aria-labelledby="about-author-name"
            className="flex min-w-0 flex-col gap-5 border-t border-outline-variant py-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8"
        >
            <div className="min-w-0 max-w-3xl space-y-3">
                <div className="space-y-1">
                    <h2
                        id="about-author-name"
                        className="font-display text-xl font-semibold tracking-tight text-on-surface"
                    >
                        {t('name')}
                    </h2>
                </div>
                <p className="break-words text-sm leading-7 text-on-surface-variant">
                    {t('bio')}
                </p>
            </div>
            {githubHref && (
                <a
                    href={githubHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ds-button-secondary ds-focus-ring min-h-11 shrink-0 self-start gap-2 px-4 py-2 text-sm"
                >
                    <FaGithub aria-hidden="true" className="size-4" />
                    {t('links.github.label')}
                </a>
            )}
        </section>
    )
}
