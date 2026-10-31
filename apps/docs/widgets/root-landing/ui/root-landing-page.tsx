import { getTranslations } from 'next-intl/server'
import { MainContent } from '~/shared/ui/main-content'
import { getSortedPostsData, type Metadata } from '~/lib/get-document'
import { getDocumentTaxonomy } from '~/lib/document-taxonomy'
import { getSearchPreviewText } from '~/lib/search-preview-text'
import { getDocHref, getDocRoutePath } from '~/lib/get-doc-route'
import { LandingHero } from './landing-hero'
import { LatestNotes } from './latest-notes'
import { ThematicFoundations } from './thematic-foundations'
import { Suspense } from 'react'
import { LatestNotesPending } from './latest-notes-pending'
import { journalPageLayout } from '~/shared/ui/journal-layout'

type LandingDoc = Partial<Metadata> & {
    title: string
    slug: string
    summary: string
}

function getDocSummary(doc: Partial<Metadata>) {
    const summary = doc.summary?.trim()
    if (summary) {
        return getSearchPreviewText(summary)
    }

    const content = getSearchPreviewText(doc.content ?? '')
    if (content) {
        return content.slice(0, 150)
    }

    return ''
}

function toLandingDoc(doc: Partial<Metadata>): LandingDoc | null {
    const title = doc.title?.trim()
    const slug = doc.slug?.trim()

    if (!title || !slug) {
        return null
    }

    return {
        ...doc,
        title,
        slug,
        summary: getDocSummary(doc),
    }
}

async function LandingLatestNotes() {
    const t = await getTranslations('rootLanding')
    let docs: LandingDoc[] = []

    try {
        docs = (await getSortedPostsData())
            .map(toLandingDoc)
            .filter((doc): doc is LandingDoc => doc !== null)
            .slice(0, 4)
    } catch (error) {
        console.error(
            '[docs] Root landing latest notes fallback activated.',
            error
        )
    }

    const latestItems = docs.map((doc) => ({
        id: String(doc.id ?? getDocRoutePath(doc) ?? doc.slug),
        href: getDocHref(doc),
        title: doc.title,
        summary: doc.summary,
        date: doc.date,
        sectionLabel:
            doc.topicLabel?.trim() || getDocumentTaxonomy(doc).section,
    }))
    return (
        <LatestNotes
            title={t('latestNotes.title')}
            viewAllLabel={t('latestNotes.viewAll')}
            items={latestItems}
            unavailableTitle={t('latestNotes.unavailableTitle')}
            unavailableDescription={t('latestNotes.unavailableDescription')}
        />
    )
}

export async function RootLandingPage() {
    const t = await getTranslations('rootLanding')
    const foundationItems = [
        {
            title: t('foundations.items.web.title'),
            description: t('foundations.items.web.description'),
            href: '/web',
        },
        {
            title: t('foundations.items.backend.title'),
            description: t('foundations.items.backend.description'),
            href: '/docs?section=backend',
        },
        {
            title: t('foundations.items.interface.title'),
            description: t('foundations.items.interface.description'),
            href: '/ui-ux',
        },
    ]

    return (
        <MainContent className={`${journalPageLayout} space-y-8 sm:space-y-10`}>
            <LandingHero />
            <Suspense fallback={<LatestNotesPending />}>
                <LandingLatestNotes />
            </Suspense>
            <ThematicFoundations
                title={t('foundations.title')}
                items={foundationItems}
            />
        </MainContent>
    )
}
