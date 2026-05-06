export function normalizeDocPath(value?: string | null) {
    if (!value) {
        return ''
    }

    return value.replace(/\\/g, '/')
}
