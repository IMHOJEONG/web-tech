'use client'

import { useState } from 'react'
import { cn } from '@web-tech/ui/lib/utils'
import Image from 'next/image'
import {
    DEFAULT_DOCUMENT_THUMBNAIL,
    DEFAULT_LOCAL_DOCUMENT_THUMBNAIL,
} from '~/shared/assets/default-thumbnails'

type DocumentThumbnailFallback = 'default' | 'local'

type DocumentThumbnailProps = {
    alt?: string
    className?: string
    fallback?: DocumentThumbnailFallback
    imageClassName?: string
    priority?: boolean
    sizes?: string
    thumbnail?: string | null
    unoptimized?: boolean
}

function getFallbackThumbnail(fallback: DocumentThumbnailFallback) {
    return fallback === 'local'
        ? DEFAULT_LOCAL_DOCUMENT_THUMBNAIL
        : DEFAULT_DOCUMENT_THUMBNAIL
}

export function DocumentThumbnail({
    alt,
    className,
    fallback = 'default',
    imageClassName,
    priority = false,
    sizes = '(max-width: 768px) 100vw, 360px',
    thumbnail,
    unoptimized = false,
}: DocumentThumbnailProps) {
    const [failedSources, setFailedSources] = useState<string[]>([])
    const primary = thumbnail ?? getFallbackThumbnail(fallback)
    const backup = getFallbackThumbnail(fallback)
    const src = failedSources.includes(primary) ? backup : primary
    const unavailable = failedSources.includes(src)
    return (
        <div
            data-thumbnail-state={
                unavailable
                    ? 'unavailable'
                    : src !== primary
                      ? 'fallback'
                      : 'primary'
            }
            className={cn(
                'relative overflow-hidden bg-surface-container-high',
                className
            )}
        >
            {unavailable ? (
                <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-surface-container-high"
                />
            ) : (
                <Image
                    src={src}
                    alt={alt ?? ''}
                    fill
                    sizes={sizes}
                    className={cn('object-cover', imageClassName)}
                    quality={90}
                    priority={priority}
                    placeholder="blur"
                    blurDataURL="/image/blur-image.webp"
                    unoptimized={unoptimized}
                    onError={() =>
                        setFailedSources((current) =>
                            current.includes(src) ? current : [...current, src]
                        )
                    }
                />
            )}
        </div>
    )
}
