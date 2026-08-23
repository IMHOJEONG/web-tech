function stringifyHeading(value: unknown): string {
    if (typeof value === 'string' || typeof value === 'number') {
        return String(value)
    }

    if (Array.isArray(value)) {
        return value.map(stringifyHeading).filter(Boolean).join(' ')
    }

    if (value && typeof value === 'object' && 'props' in value) {
        return stringifyHeading(
            (value as { props?: { children?: unknown } }).props?.children
        )
    }

    return ''
}

export function slugifyHeading(title: unknown) {
    return stringifyHeading(title)
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
}
