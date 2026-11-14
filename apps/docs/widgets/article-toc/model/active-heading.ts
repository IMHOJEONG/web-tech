export type HeadingPosition = { href: string; top: number }

export function getHeadingId(href: string) {
    if (!href.startsWith('#') || href.length === 1) return null
    try {
        return decodeURIComponent(href.slice(1))
    } catch {
        return null
    }
}

export function findActiveHeading(
    headings: HeadingPosition[],
    readingLine: number,
    atBottom = false
) {
    if (!headings.length) return null
    if (atBottom) return headings[headings.length - 1]!.href

    let left = 0
    let right = headings.length - 1
    let active = 0
    while (left <= right) {
        const middle = Math.floor((left + right) / 2)
        if (headings[middle]!.top <= readingLine) {
            active = middle
            left = middle + 1
        } else {
            right = middle - 1
        }
    }
    return headings[active]!.href
}
