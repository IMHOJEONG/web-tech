import {
    getDocumentTaxonomy,
    type DocChannel,
    type DocumentTaxonomySource,
} from './document-taxonomy.ts'

export type { DocChannel } from './document-taxonomy.ts'

export function getDocChannel(source?: DocumentTaxonomySource): DocChannel {
    return getDocumentTaxonomy(source).channel
}

export function isDocInChannel(
    channel: Extract<DocChannel, 'web' | 'mobile' | 'uiux'>,
    source?: DocumentTaxonomySource
) {
    return getDocChannel(source) === channel
}
