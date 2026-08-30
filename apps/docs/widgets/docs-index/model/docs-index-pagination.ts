export const ALL_DOCS_PAGE_SIZE = 8

export function clampPage(page: number, totalPages: number) {
    if (!Number.isFinite(page) || page < 1) {
        return 1
    }

    return Math.min(Math.trunc(page), totalPages)
}

export function getPaginationRange({
    currentPage,
    pageSize = ALL_DOCS_PAGE_SIZE,
    totalCount,
}: {
    currentPage: number
    pageSize?: number
    totalCount: number
}) {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
    const page = clampPage(currentPage, totalPages)
    const startIndex = (page - 1) * pageSize
    const rangeStart = totalCount === 0 ? 0 : startIndex + 1
    const rangeEnd = Math.min(totalCount, startIndex + pageSize)

    return {
        page,
        pageSize,
        startIndex,
        totalPages,
        rangeStart,
        rangeEnd,
    }
}
