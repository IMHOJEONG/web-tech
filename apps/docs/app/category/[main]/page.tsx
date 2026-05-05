import Link from 'next/link'
import {
    categoryTree,
    getSubCategories,
} from '~/entities/category/model/category'
import { SubCategoryCard } from '~/entities/category/ui/sub-category-card'
import { getSubCategoryOverview } from '~/lib/get-category'

export default async function Page({
    params,
}: {
    params: Promise<{ main: string }>
}) {
    const { main: mainCategory } = await params
    const subCategories = getSubCategories(mainCategory) ?? []
    const overview = await getSubCategoryOverview(mainCategory)
    const category = categoryTree.find((item) => item.url === mainCategory)

    return (
        <main className="docs-shell px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <div className="space-y-8">
                <section className="ds-panel p-6 sm:p-8">
                    <div className="max-w-3xl space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-outline">
                            {category?.title ?? mainCategory}
                        </p>
                        <h1 className="text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
                            세부 기술 주제를 골라보세요.
                        </h1>
                        <p className="text-sm leading-7 text-on-surface-variant sm:text-base">
                            {category?.title ?? mainCategory} 카테고리 안에서
                            하위 기술별 문서를 더 빠르게 찾을 수 있도록
                            정리했습니다.
                        </p>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-outline">
                            Sub Categories
                        </p>
                        <h2 className="text-2xl font-bold tracking-tight text-on-surface">
                            세부 기술 주제
                        </h2>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {subCategories.map(({ title, url }) => {
                            const sub = overview.find(
                                (item) => item.title === title
                            )

                            return (
                                <Link
                                    key={url}
                                    href={url}
                                    className="group ds-card bg-surface-container-lowest p-4 hover:-translate-y-1"
                                >
                                    <SubCategoryCard id={title} />
                                    <div className="mt-3 border-t border-outline-variant pt-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-xs font-semibold tracking-[0.18em] text-outline uppercase">
                                                Topic
                                            </span>
                                            <span className="ds-chip-muted px-2.5 py-1 text-xs font-medium normal-case tracking-normal">
                                                문서 {sub?.docCount ?? 0}개
                                            </span>
                                        </div>
                                        {sub?.latestTitle ? (
                                            <div className="ds-panel-muted mt-4 px-3 py-3">
                                                <p className="text-[11px] font-semibold tracking-[0.18em] text-outline uppercase">
                                                    최근 업데이트
                                                </p>
                                                <p className="mt-2 text-sm font-medium text-on-surface">
                                                    {sub.latestTitle}
                                                </p>
                                                {sub.latestDate ? (
                                                    <p className="mt-1 text-xs text-on-surface-variant">
                                                        {sub.latestDate}
                                                    </p>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </section>
            </div>
        </main>
    )
}
