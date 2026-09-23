import { UiUxArticleCard } from './uiux-article-card'
import { UIUX_FALLBACK_IMAGES } from './uiux-hub.types'
import type { UiUxDoc } from '../model/uiux-hub-docs'

export function UiUxHubTutorialSection({ tutorial }: { tutorial: UiUxDoc }) {
    return (
        <section data-testid="uiux-tutorial-card" className="min-w-0">
            <UiUxArticleCard
                doc={tutorial}
                fallbackImage={UIUX_FALLBACK_IMAGES.tutorial}
            />
        </section>
    )
}
