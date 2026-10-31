import { JournalPageHeader } from '~/shared/ui/journal-page-header'

export function UiUxHubHero({
    eyebrow,
    titleLineOne,
    titleLineTwo,
    description,
}: {
    eyebrow: string
    titleLineOne: string
    titleLineTwo: string
    description: string
}) {
    return (
        <section>
            <JournalPageHeader
                eyebrow={eyebrow}
                title={`${titleLineOne} ${titleLineTwo}`}
                description={description}
            />
        </section>
    )
}
