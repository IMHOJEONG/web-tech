import { UiUxArticleCard } from './uiux-article-card'
import { UIUX_FALLBACK_IMAGES, type UiUxDoc } from './uiux-hub.types'

export function UiUxHubTutorialSection({
    tutorial,
    tutorialLabel,
}: {
    tutorial: UiUxDoc
    tutorialLabel: string
}) {
    return (
        <section data-testid="uiux-tutorial-card" className="min-w-0">
            <UiUxArticleCard
                doc={tutorial}
                label={tutorialLabel}
                fallbackImage={UIUX_FALLBACK_IMAGES.tutorial}
            />
        </section>
    )
}
