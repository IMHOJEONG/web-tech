import { useTranslations } from 'next-intl'
import { MainContent } from '~/shared/ui/main-content'
import { PendingStatus } from '~/shared/ui/pending-status'
import { SkeletonBlock } from '~/shared/ui/skeleton-block'

type CategoryLevel = 'index' | 'main' | 'sub'

export function CategoryPending({
    level,
    categoryTitle,
}: {
    level: CategoryLevel
    categoryTitle?: string
}) {
    const t = useTranslations('category')
    return (
        <MainContent
            aria-busy="true"
            data-testid="content-pending"
            data-page-pending={`category-${level}`}
            className="docs-shell px-4 py-10 sm:px-6 sm:py-12 lg:px-8"
        >
            <PendingStatus />
            <div className={level === 'index' ? 'space-y-10' : 'space-y-8'}>
                <section className="ds-panel p-6 sm:p-8">
                    <div
                        className={
                            level === 'sub'
                                ? 'grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)]'
                                : 'max-w-3xl'
                        }
                    >
                        <div className="space-y-4">
                            {level === 'index' || categoryTitle ? (
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-outline">
                                    {categoryTitle ?? t('index.label')}
                                </p>
                            ) : (
                                <SkeletonBlock className="h-4 w-24" />
                            )}
                            <h1 className="text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
                                {t(`${level}.title`)}
                            </h1>
                            {level === 'main' && !categoryTitle ? (
                                <SkeletonBlock className="h-14 w-full" />
                            ) : (
                                <p className="text-sm leading-7 text-on-surface-variant sm:text-base">
                                    {level === 'main'
                                        ? t('main.description', {
                                              category: categoryTitle!,
                                          })
                                        : t(`${level}.description`)}
                                </p>
                            )}
                        </div>
                        {level === 'sub' && (
                            <div
                                aria-hidden="true"
                                className="grid gap-3 motion-safe:animate-pulse sm:grid-cols-2 lg:grid-cols-1"
                            >
                                {[0, 1].map((i) => (
                                    <div
                                        key={i}
                                        className="ds-panel-muted px-4 py-4"
                                    >
                                        <SkeletonBlock className="h-4 w-20" />
                                        <SkeletonBlock className="mt-2 h-8 w-3/4" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
                <section
                    className="space-y-4"
                    data-skeleton-anchor="category-results"
                >
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-outline">
                            {t(
                                level === 'index'
                                    ? 'index.groupsLabel'
                                    : level === 'main'
                                      ? 'main.label'
                                      : 'sub.documentsLabel'
                            )}
                        </p>
                        <h2 className="text-2xl font-bold tracking-tight text-on-surface">
                            {t(
                                level === 'index'
                                    ? 'index.groupsTitle'
                                    : level === 'main'
                                      ? 'main.topicsTitle'
                                      : 'sub.documentsTitle'
                            )}
                        </h2>
                    </div>
                    <div
                        aria-hidden="true"
                        className="grid items-start gap-5 motion-safe:animate-pulse md:grid-cols-2 xl:grid-cols-3"
                    >
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="ds-card space-y-4 bg-surface-container-lowest p-4"
                            >
                                <SkeletonBlock
                                    className={
                                        level === 'index'
                                            ? 'aspect-[16/8] w-full rounded-2xl'
                                            : level === 'sub'
                                              ? 'aspect-square w-full rounded-2xl'
                                              : 'm-3 size-12 rounded-2xl'
                                    }
                                />
                                <SkeletonBlock className="h-7 w-3/4" />
                                <SkeletonBlock className="h-12 w-full" />
                                <div className="space-y-3 border-t border-outline-variant pt-3">
                                    <SkeletonBlock className="h-7 w-24" />
                                    {level !== 'sub' && (
                                        <SkeletonBlock className="h-24 w-full" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </MainContent>
    )
}

export function CategoryIndexPending() {
    return <CategoryPending level="index" />
}
export function CategoryMainPending({
    categoryTitle,
}: {
    categoryTitle: string
}) {
    return <CategoryPending level="main" categoryTitle={categoryTitle} />
}
export function CategorySubPending() {
    return <CategoryPending level="sub" />
}
