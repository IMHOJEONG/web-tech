import { UiUxArticleCard } from './uiux-article-card'
import type { UiUxDoc } from '../model/uiux-hub-docs'
import { journalListLayout } from '~/shared/ui/journal-layout'

export function UiUxHubFeaturedSection({ docs }: { docs: UiUxDoc[] }) {
    if (docs.length === 0) return null
    return (
        <section
            data-testid="uiux-featured-articles"
            className={journalListLayout}
        >
            {docs.map((doc) => (
                <UiUxArticleCard key={doc.href} doc={doc} />
            ))}
        </section>
    )
}
