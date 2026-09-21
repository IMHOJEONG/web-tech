import { UiUxArticleCard } from './uiux-article-card'
import { UIUX_FALLBACK_IMAGES, type UiUxDoc } from './uiux-hub.types'

export function UiUxHubFeaturedSection({
    featured,
    secondaryOne,
    secondaryTwo,
    primaryLabel,
    researchLabel,
    guideLabel,
}: {
    featured: UiUxDoc
    secondaryOne: UiUxDoc
    secondaryTwo: UiUxDoc
    primaryLabel: string
    researchLabel: string
    guideLabel: string
}) {
    return (
        <section
            data-testid="uiux-featured-articles"
            className="grid min-w-0 gap-4"
        >
            <UiUxArticleCard
                doc={featured}
                label={primaryLabel}
                fallbackImage={UIUX_FALLBACK_IMAGES.featured}
            />
            <UiUxArticleCard
                doc={secondaryOne}
                label={researchLabel}
                fallbackImage={UIUX_FALLBACK_IMAGES.first}
            />
            <UiUxArticleCard
                doc={secondaryTwo}
                label={guideLabel}
                fallbackImage={UIUX_FALLBACK_IMAGES.second}
            />
        </section>
    )
}
