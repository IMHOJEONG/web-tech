import { CategoryDocumentCard } from '~/entities/category/ui/category-document-card'
import { getSubCategoryData } from '~/lib/get-category'

export default async function Page({
    params,
}: {
    params: Promise<{ main: string; sub: string }>
}) {
    const { main, sub } = await params
    const data = await getSubCategoryData(main, sub)
    const latestDoc = data[0]

    return (
        <main className="docs-shell px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <div className="space-y-8">
                <section className="rounded-[28px] border border-zinc-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,244,245,0.92))] p-6 shadow-[0_20px_60px_rgba(24,24,27,0.06)] dark:border-zinc-800 dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.92))] sm:p-8">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)]">
                        <div className="space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                                {main} / {sub}
                            </p>
                            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
                                관련 문서를 한곳에서 살펴보세요.
                            </h1>
                            <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400 sm:text-base">
                                이 주제와 연결된 문서를 카드형으로
                                모아두었습니다. 필요한 글을 빠르게 훑고 바로
                                상세 페이지로 이동할 수 있습니다.
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/80 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                                    문서 수
                                </p>
                                <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                    {data.length}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/80 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                                    최근 업데이트
                                </p>
                                <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                    {latestDoc?.title ?? '문서 준비 중'}
                                </p>
                                {latestDoc?.date ? (
                                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                        {latestDoc.date}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                            Documents
                        </p>
                        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                            문서 목록
                        </h2>
                    </div>

                    <div className="grid place-items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {data.map((item) => {
                            return (
                                <CategoryDocumentCard
                                    key={item.title}
                                    data={item}
                                />
                            )
                        })}
                    </div>
                </section>
            </div>
        </main>
    )
}
