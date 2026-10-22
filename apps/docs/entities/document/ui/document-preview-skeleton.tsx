import { SkeletonBlock } from '~/shared/ui/skeleton-block'
import {
    documentPreviewLayout,
    documentPreviewThumbnailLayout,
} from './document-preview-layout'

export function DocumentPreviewSkeleton() {
    return (
        <div
            aria-hidden="true"
            data-skeleton-anchor="preview-card"
            className={`ds-card ${documentPreviewLayout}`}
        >
            <div className="min-w-0 space-y-4">
                <div className="space-y-2">
                    <SkeletonBlock className="h-4 w-1/3" />
                    <SkeletonBlock className="h-16 w-full sm:h-20" />
                </div>
                <div className="space-y-2">
                    <SkeletonBlock className="h-4 w-full" />
                    <SkeletonBlock className="h-4 w-4/5" />
                </div>
                <SkeletonBlock className="h-5 w-2/3" />
            </div>
            <SkeletonBlock className={documentPreviewThumbnailLayout} />
        </div>
    )
}
