import type { ReactNode } from 'react'
import type { TocItem } from 'remark-flexible-toc'
import type { Metadata } from '~/lib/get-document'
import type { ArticleTimingMeasure } from '~/lib/article-timing.types'

export interface ArticleContentLayoutProps {
    supplementary?: ReactNode
    toc?: TocItem[]
    children: ReactNode
}

export interface ArticleSupplementaryProps {
    target: Partial<Metadata>
    measure: ArticleTimingMeasure
}

export interface ArticleSupplementaryBoundaryProps {
    children?: ReactNode
    loadingLabel: string
}
