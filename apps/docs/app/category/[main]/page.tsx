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
                <section className="rounded-[28px] border border-zinc-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,244,245,0.92))] p-6 shadow-[0_20px_60px_rgba(24,24,27,0.06)] dark:border-zinc-800 dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.92))] sm:p-8">
                    <div className="max-w-3xl space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                            {category?.title ?? mainCategory}
                        </p>
                        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
                            세부 기술 주제를 골라보세요.
                        </h1>
                        <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400 sm:text-base">
                            {category?.title ?? mainCategory} 카테고리 안에서
                            하위 기술별 문서를 더 빠르게 찾을 수 있도록
                            정리했습니다.
                        </p>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                            Sub Categories
                        </p>
                        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
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
                                    className="group rounded-3xl border border-zinc-200/80 bg-white/90 p-4 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/70 dark:hover:border-zinc-700"
                                >
                                    <SubCategoryCard id={title} />
                                    <div className="mt-3 border-t border-zinc-200/70 pt-3 dark:border-zinc-800">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-xs font-semibold tracking-[0.18em] text-zinc-500 uppercase dark:text-zinc-400">
                                                Topic
                                            </span>
                                            <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                                                문서 {sub?.docCount ?? 0}개
                                            </span>
                                        </div>
                                        {sub?.latestTitle ? (
                                            <div className="mt-4 rounded-2xl border border-zinc-200/70 bg-zinc-50/80 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
                                                <p className="text-[11px] font-semibold tracking-[0.18em] text-zinc-500 uppercase dark:text-zinc-400">
                                                    최근 업데이트
                                                </p>
                                                <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                    {sub.latestTitle}
                                                </p>
                                                {sub.latestDate ? (
                                                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
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
