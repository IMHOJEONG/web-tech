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
                <section className="ds-panel p-6 sm:p-8">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)]">
                        <div className="space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-outline">
                                {main} / {sub}
                            </p>
                            <h1 className="text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
                                관련 문서를 한곳에서 살펴보세요.
                            </h1>
                            <p className="text-sm leading-7 text-on-surface-variant sm:text-base">
                                이 주제와 연결된 문서를 카드형으로
                                모아두었습니다. 필요한 글을 빠르게 훑고 바로
                                상세 페이지로 이동할 수 있습니다.
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            <div className="ds-panel-muted px-4 py-4">
                                <p className="text-xs uppercase tracking-[0.18em] text-outline">
                                    문서 수
                                </p>
                                <p className="mt-2 text-2xl font-bold text-on-surface">
                                    {data.length}
                                </p>
                            </div>
                            <div className="ds-panel-muted px-4 py-4">
                                <p className="text-xs uppercase tracking-[0.18em] text-outline">
                                    최근 업데이트
                                </p>
                                <p className="mt-2 text-sm font-medium text-on-surface">
                                    {latestDoc?.title ?? '문서 준비 중'}
                                </p>
                                {latestDoc?.date ? (
                                    <p className="mt-1 text-xs text-on-surface-variant">
                                        {latestDoc.date}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-outline">
                            Documents
                        </p>
                        <h2 className="text-2xl font-bold tracking-tight text-on-surface">
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
