export function slugifyHeading(title: string) {
    return (
        title
            .trim()
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s-]/gu, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
    )
}
