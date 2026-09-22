function stringifyHeading(value: unknown): string {
    if (typeof value === 'string' || typeof value === 'number') {
        return String(value)
    }

    if (Array.isArray(value)) {
        return value.map(stringifyHeading).filter(Boolean).join(' ')
    }

    if (value && typeof value === 'object' && 'props' in value) {
        const props = value.props
        if (props && typeof props === 'object' && 'children' in props) {
            return stringifyHeading(props.children)
        }
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
