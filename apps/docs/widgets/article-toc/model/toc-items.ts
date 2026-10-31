import type { HeadingDepth, HeadingParent, TocItem } from 'remark-flexible-toc'

export type TocFilters = {
    maxDepth?: HeadingDepth
    exclude?: string | string[]
    skipLevels?: HeadingDepth[]
    skipParents?: Exclude<HeadingParent, 'root'>[]
}

export function filterTocItems(
    toc: TocItem[] = [],
    {
        maxDepth = 6,
        exclude,
        skipLevels = [1],
        skipParents = [],
    }: TocFilters = {}
) {
    const pattern = exclude
        ? new RegExp(Array.isArray(exclude) ? exclude.join('|') : exclude, 'i')
        : undefined
    return toc.filter(
        (heading) =>
            heading.depth <= maxDepth &&
            !skipLevels.includes(heading.depth) &&
            (heading.parent === 'root' ||
                !skipParents.includes(heading.parent)) &&
            !pattern?.test(heading.value)
    )
}
