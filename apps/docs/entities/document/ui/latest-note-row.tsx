import { DocumentPreviewCard } from './document-preview-card'

export type LatestNoteRowItem = {
    id: string
    href: string
    title: string
    summary: string
    date?: string
    sectionLabel: string
}

type LatestNoteRowProps = {
    item: LatestNoteRowItem
}

export function LatestNoteRow({ item }: LatestNoteRowProps) {
    return (
        <DocumentPreviewCard
            href={item.href}
            title={item.title}
            summary={item.summary}
            topic={item.sectionLabel}
            date={item.date}
            headingLevel="h3"
        />
    )
}
