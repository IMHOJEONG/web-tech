export const DEFAULT_DOCUMENT_THUMBNAIL = '/default/no-image.webp'
export const DEFAULT_LOCAL_DOCUMENT_THUMBNAIL = '/default/local-document.svg'

export function hasDocumentThumbnail(thumbnail?: string | null) {
    const value = thumbnail?.trim()
    if (!value) return false

    try {
        const { pathname } = new URL(value, 'https://thumbnail.invalid')
        return (
            pathname !== DEFAULT_DOCUMENT_THUMBNAIL &&
            pathname !== DEFAULT_LOCAL_DOCUMENT_THUMBNAIL
        )
    } catch {
        return false
    }
}
