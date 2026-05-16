export type ArticleDetailChannel = 'web' | 'mobile' | 'uiux'

export type ArticleDetailProps = {
    channel: ArticleDetailChannel
}

export type NewsletterCardProps = {
    title: string
    description: string
    placeholder: string
    buttonLabel: string
    note?: string
    compact?: boolean
}

export type RelatedSignal = {
    category: string
    title: string
    meta: string
    href: string
}

export type ArticleDetailMainProps = {
    badge: string
    note: string
    heroReadTime: string
    heroTitle: string
    heroAuthorAlt: string
    heroAuthorName: string
    heroAuthorMeta: string
    heroImageAlt: string
    bodyIntro: string
    bodyParadoxTitle: string
    bodyParadoxDescription: string
    codeFileLabel: string
    codeActionLabel: string
    bodyStreamParagraph: string
    bodyVisualTitle: string
    bodyDesignAltOne: string
    bodyDesignAltTwo: string
    bodyMobileTitle: string
    bodyMobileMockupAlt: string
    bodyMobileParagraph: string
    mobileNewsletter: NewsletterCardProps
    authorAlt: string
    authorTitle: string
    authorDescription: string
    authorLinks: {
        twitter: string
        github: string
        linkedin: string
    }
}

export type ArticleDetailSidebarProps = {
    tocTitle: string
    tocItems: string[]
    joinTitle: string
    sidebarNewsletter: NewsletterCardProps
    relatedTitle: string
    relatedSignals: RelatedSignal[]
}
