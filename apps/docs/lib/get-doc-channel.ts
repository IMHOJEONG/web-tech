import { normalizeDocPath } from '~/lib/normalize-doc-path'

export type DocChannel = 'web' | 'mobile' | 'uiux' | 'other'

export function getDocChannel(fileName?: string | null): DocChannel {
    const normalizedFileName = normalizeDocPath(fileName ?? '')

    if (
        normalizedFileName.includes('/mobile/') ||
        normalizedFileName.includes('/react-native/') ||
        normalizedFileName.includes('/ios/') ||
        normalizedFileName.includes('/android/')
    ) {
        return 'mobile'
    }

    if (
        normalizedFileName.includes('/data/shadcn/') ||
        normalizedFileName.includes('/ui-ux/')
    ) {
        return 'uiux'
    }

    if (
        normalizedFileName.includes('/category/fe/') ||
        normalizedFileName.includes('/data/v8/')
    ) {
        return 'web'
    }

    return 'other'
}

export function isDocInChannel(
    channel: Extract<DocChannel, 'web' | 'mobile' | 'uiux'>,
    fileName?: string | null
) {
    return getDocChannel(fileName) === channel
}
