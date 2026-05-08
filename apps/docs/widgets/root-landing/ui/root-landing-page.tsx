import { getTranslations } from 'next-intl/server'
import { getSortedPostsData, type Metadata } from '~/lib/get-document'
import { getDocChannel } from '~/lib/get-doc-channel'
import { LandingHero } from './landing-hero'
import { LatestNotes } from './latest-notes'
import { ThematicFoundations } from './thematic-foundations'

type LandingDoc = Partial<Metadata> & {
    title: string
    slug: string
    summary: string
}

function stripMarkup(text: string) {
    return text
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

function getDocSummary(doc: Partial<Metadata>) {
    const summary = doc.summary?.trim()
    if (summary) {
        return summary
    }

    const content = stripMarkup(doc.content ?? '')
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

function getSectionLabel(
    doc: LandingDoc,
    t: Awaited<ReturnType<typeof getTranslations>>
) {
    const channel = getDocChannel(doc.fileName)

    switch (channel) {
        case 'mobile':
            return t('latestNotes.sectionLabels.mobile')
        case 'uiux':
            return t('latestNotes.sectionLabels.uiux')
        case 'web':
            return t('latestNotes.sectionLabels.web')
        default:
            return t('latestNotes.sectionLabels.systems')
    }
}

export async function RootLandingPage() {
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

    const foundationItems = [
        {
            area: 'AREA_01',
            title: t('foundations.items.web.title'),
            description: t('foundations.items.web.description'),
            href: '/web',
        },
        {
            area: 'AREA_02',
            title: t('foundations.items.product.title'),
            description: t('foundations.items.product.description'),
            href: '/feed',
        },
        {
            area: 'AREA_03',
            title: t('foundations.items.interface.title'),
            description: t('foundations.items.interface.description'),
            href: '/ui-ux',
        },
        {
            area: 'AREA_04',
            title: t('foundations.items.mobile.title'),
            description: t('foundations.items.mobile.description'),
            href: '/mobile',
        },
    ]

    const latestItems = docs.map((doc) => ({
        href: `/docs/${doc.slug}`,
        title: doc.title,
        summary: doc.summary,
        date: doc.date,
        sectionLabel: getSectionLabel(doc, t),
    }))

    return (
        <main>
            <LandingHero />
            <ThematicFoundations
                eyebrow={t('foundations.eyebrow')}
                title={t('foundations.title')}
                countLabel={t('foundations.countLabel')}
                items={foundationItems}
            />
            <LatestNotes
                eyebrow={t('latestNotes.eyebrow')}
                title={t('latestNotes.title')}
                viewAllLabel={t('latestNotes.viewAll')}
                openLabel={t('latestNotes.open')}
                items={latestItems}
                unavailableTitle={t('latestNotes.unavailableTitle')}
                unavailableDescription={t('latestNotes.unavailableDescription')}
            />
        </main>
    )
}
