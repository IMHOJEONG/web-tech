import { getTime } from '@web-tech/ui/lib/time'
import { getTranslations } from 'next-intl/server'
import { HubPage } from '~/widgets/content-hub/ui/hub-page'
import {
    getChannelHubDocs,
    type HubChannel,
} from '~/widgets/content-hub/model/get-channel-hub-docs'

type ChannelHubPageProps = {
    channel: HubChannel
}

function getChannelKey(channel: HubChannel) {
    switch (channel) {
        case 'web':
            return 'web'
        case 'mobile':
            return 'mobile'
        case 'uiux':
            return 'uiux'
    }
}

export async function ChannelHubPage({ channel }: ChannelHubPageProps) {
    const t = await getTranslations('channelHub')
    const channelKey = getChannelKey(channel)
    const channelDocs = await getChannelHubDocs(channel)
    const docs = channelDocs.slice(0, 6)
    const latestDate = channelDocs[0]?.date
        ? getTime(channelDocs[0].date)
        : null

    const panels = ['first', 'second', 'third'].map((panelKey) => ({
        title: t(`${channelKey}.panels.${panelKey}.title`),
        description: t(`${channelKey}.panels.${panelKey}.description`),
        items: t.raw(`${channelKey}.panels.${panelKey}.items`) as string[],
    }))

    return (
        <HubPage
            eyebrow={t(`${channelKey}.hero.eyebrow`)}
            title={t(`${channelKey}.hero.title`)}
            description={t(`${channelKey}.hero.description`)}
            stats={[
                {
                    label: t('stats.totalDocs'),
                    value: String(channelDocs.length).padStart(2, '0'),
                },
                {
                    label: t('stats.focusAreas'),
                    value: String(panels.length).padStart(2, '0'),
                },
                {
                    label: t('stats.latestUpdate'),
                    value: latestDate ?? t('stats.pending'),
                },
            ]}
            docs={docs}
            panels={panels}
            latestEyebrow={t('latest.eyebrow')}
            latestTitle={t('latest.title')}
            latestActionHref={`/feed?topic=${channel}`}
            latestActionLabel={t('latest.action')}
            emptyTitle={t(`${channelKey}.empty.title`)}
            emptyDescription={t(`${channelKey}.empty.description`)}
        />
    )
}
