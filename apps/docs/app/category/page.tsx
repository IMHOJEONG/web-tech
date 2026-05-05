import Link from 'next/link'
import {
    categoryTree,
    makeCategoryUrl,
} from '~/entities/category/model/category'
import { MainCategoryCard } from '~/entities/category/ui/main-category-card'
import { getMainCategoryOverview } from '~/lib/get-category'

export default async function Page() {
    const mainCategories = categoryTree.map((category) => ({
        ...category,
        href: makeCategoryUrl([category.url]),
    }))
    const categoryOverview = await getMainCategoryOverview()

    const popularTopics = categoryTree.flatMap((category) =>
        category.sub.map((topic) => ({
            title: topic.title,
            href: makeCategoryUrl([category.url, topic.url]),
            group: category.title,
        }))
    )

    return (
        <main className="docs-shell px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <div className="space-y-10">
                <section className="relative overflow-hidden rounded-[28px] border border-zinc-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,244,245,0.92))] p-6 shadow-[0_24px_80px_rgba(24,24,27,0.08)] dark:border-zinc-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.12),_transparent_34%),linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.92))] sm:p-8">
                    <div className="max-w-3xl space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                            Category Hub
                        </p>
                        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
                            주제별로 문서를 탐색해보세요.
                        </h1>
                        <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400 sm:text-base">
                            프론트엔드, 백엔드, 컴퓨터 과학까지 큰 흐름으로 먼저
                            나눈 뒤, 세부 기술 주제로 더 빠르게 들어갈 수 있도록
                            구성했습니다.
                        </p>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                            Main Categories
                        </p>
                        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                            큰 주제부터 고르기
                        </h2>
                    </div>

                    <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {mainCategories.map((category) =>
                            (() => {
                                const overview = categoryOverview.find(
                                    (item) => item.url === category.url
                                )

                                return (
                                    <Link
                                        key={category.href}
                                        href={category.href}
                                        className="group rounded-3xl border border-zinc-200/80 bg-white/90 p-4 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/70 dark:hover:border-zinc-700"
                                    >
                                        <MainCategoryCard id={category.title} />
                                        <div className="mt-3 border-t border-zinc-200/70 pt-3 dark:border-zinc-800">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-xs font-semibold tracking-[0.18em] text-zinc-500 uppercase dark:text-zinc-400">
                                                    {category.title}
                                                </span>
                                                <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                                                    문서{' '}
                                                    {overview?.docCount ?? 0}개
                                                </span>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {category.sub.map((topic) => (
                                                    <span
                                                        key={topic.url}
                                                        className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                                                    >
                                                        {topic.title}
                                                    </span>
                                                ))}
                                            </div>
                                            {overview?.latestTitle ? (
                                                <div className="mt-4 rounded-2xl border border-zinc-200/70 bg-zinc-50/80 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
                                                    <p className="text-[11px] font-semibold tracking-[0.18em] text-zinc-500 uppercase dark:text-zinc-400">
                                                        최근 업데이트
                                                    </p>
                                                    <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                        {overview.latestTitle}
                                                    </p>
                                                    {overview.latestDate ? (
                                                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                                            {
                                                                overview.latestDate
                                                            }
                                                        </p>
                                                    ) : null}
                                                </div>
                                            ) : null}
                                        </div>
                                    </Link>
                                )
                            })()
                        )}
                    </div>
                </section>

                <section className="space-y-4 border-t border-zinc-200/80 pt-8 dark:border-zinc-800">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                            Popular Topics
                        </p>
                        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                            인기 주제
                        </h2>
                        <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                            자주 찾는 기술 주제로 바로 들어가서 관련 문서를
                            빠르게 살펴볼 수 있습니다.
                        </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {popularTopics.map((topic) => (
                            <Link
                                key={topic.href}
                                href={topic.href}
                                className="rounded-2xl border border-zinc-200/80 bg-white/90 px-4 py-3 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/70 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                            >
                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                    {topic.title}
                                </p>
                                <p className="mt-1 text-xs tracking-[0.18em] text-zinc-500 uppercase dark:text-zinc-400">
                                    {topic.group}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    )
}
