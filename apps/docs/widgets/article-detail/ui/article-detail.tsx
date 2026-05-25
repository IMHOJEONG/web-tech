import { getTranslations } from 'next-intl/server'
import { ArticleDetailMain } from '~/widgets/article-detail/ui/article-detail-main'
import { ArticleDetailSidebar } from '~/widgets/article-detail/ui/article-detail-sidebar'
import type { ArticleDetailProps } from '~/widgets/article-detail/ui/article-detail.types'

export async function ArticleDetail({ channel }: ArticleDetailProps) {
    const t = await getTranslations('articleDetail')

    const meta = {
        badge: t(`channels.${channel}.badge`),
        note: t(`channels.${channel}.note`),
    }

    const tocItems = [
        t('toc.paradox'),
        t('toc.logic'),
        t('toc.visual'),
        t('toc.mobile'),
        t('toc.summary'),
    ]

    const relatedSignals = [
        {
            category: t('related.items.rust.category'),
            title: t('related.items.rust.title'),
            meta: t('related.items.rust.meta'),
            href: '/mobile',
        },
        {
            category: t('related.items.ethics.category'),
            title: t('related.items.ethics.title'),
            meta: t('related.items.ethics.meta'),
            href: '/ui-ux',
        },
        {
            category: t('related.items.transport.category'),
            title: t('related.items.transport.title'),
            meta: t('related.items.transport.meta'),
            href: '/web',
        },
    ]

    return (
        <main className="w-full text-on-surface">
            <div className="mx-auto h-0.5 max-w-page">
                <div className="ds-progress-line w-1/3" />
            </div>

            <div className="mx-auto grid w-full max-w-page gap-6 px-4 pb-16 pt-10 sm:px-6 md:px-8 md:pt-12 lg:gap-8 lg:pb-20 lg:pt-16 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <ArticleDetailMain
                    badge={meta.badge}
                    note={meta.note}
                    heroReadTime={t('hero.readTime')}
                    heroTitle={t('hero.title')}
                    heroAuthorAlt={t('hero.authorAlt')}
                    heroAuthorName={t('hero.authorName')}
                    heroAuthorMeta={t('hero.authorMeta')}
                    heroImageAlt={t('hero.heroImageAlt')}
                    bodyIntro={t('body.intro')}
                    bodyParadoxTitle={t('body.sections.paradox.title')}
                    bodyParadoxDescription={t(
                        'body.sections.paradox.description'
                    )}
                    codeFileLabel={t('code.fileLabel')}
                    codeActionLabel={t('code.actionLabel')}
                    bodyStreamParagraph={t('body.streamParagraph')}
                    bodyVisualTitle={t('body.sections.visual.title')}
                    bodyDesignAltOne={t('body.designAltOne')}
                    bodyDesignAltTwo={t('body.designAltTwo')}
                    bodyMobileTitle={t('body.sections.mobile.title')}
                    bodyMobileMockupAlt={t('body.mobileMockupAlt')}
                    bodyMobileParagraph={t('body.mobileParagraph')}
                    mobileNewsletter={{
                        title: t('newsletter.mobile.title'),
                        description: t('newsletter.mobile.description'),
                        placeholder: t('newsletter.mobile.placeholder'),
                        buttonLabel: t('newsletter.mobile.button'),
                        note: t('newsletter.mobile.note'),
                    }}
                    authorAlt={t('author.alt')}
                    authorTitle={t('author.title')}
                    authorDescription={t('author.description')}
                    authorLinks={{
                        twitter: t('author.links.twitter'),
                        github: t('author.links.github'),
                        linkedin: t('author.links.linkedin'),
                    }}
                />

                <ArticleDetailSidebar
                    tocTitle={t('sidebar.tocTitle')}
                    tocItems={tocItems}
                    joinTitle={t('sidebar.joinTitle')}
                    sidebarNewsletter={{
                        title: t('newsletter.sidebar.title'),
                        description: t('newsletter.sidebar.description'),
                        placeholder: t('newsletter.sidebar.placeholder'),
                        buttonLabel: t('newsletter.sidebar.button'),
                    }}
                    relatedTitle={t('related.title')}
                    relatedSignals={relatedSignals}
                />
            </div>
        </main>
    )
}
