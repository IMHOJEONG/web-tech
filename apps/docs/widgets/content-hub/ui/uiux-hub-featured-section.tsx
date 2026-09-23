import { UiUxArticleCard } from './uiux-article-card'
import { UIUX_FALLBACK_IMAGES } from './uiux-hub.types'
import type { UiUxDoc } from '../model/uiux-hub-docs'

export function UiUxHubFeaturedSection({ docs }: { docs: UiUxDoc[] }) {
    if (docs.length === 0) return null
    const images = [
        UIUX_FALLBACK_IMAGES.featured,
        UIUX_FALLBACK_IMAGES.first,
        UIUX_FALLBACK_IMAGES.second,
    ]
    return (
        <section
            data-testid="uiux-featured-articles"
            className="grid min-w-0 gap-4"
        >
            {docs.map((doc, index) => (
                <UiUxArticleCard
                    key={doc.href}
                    doc={doc}
                    fallbackImage={
                        images[index] ?? UIUX_FALLBACK_IMAGES.featured
                    }
                />
            ))}
        </section>
    )
}
