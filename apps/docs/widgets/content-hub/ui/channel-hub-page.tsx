import { getTime } from '@web-tech/ui/lib/time'
import { getTranslations } from 'next-intl/server'
import { HubPage } from '~/widgets/content-hub/ui/hub-page'
import { HubTopicFilters } from './hub-topic-filters'
import {
    resolveHubTopics,
    type HubSearchParams,
} from '../model/hub-topic-filter'
import {
    getChannelHubDocs,
    type HubChannel,
} from '~/widgets/content-hub/model/get-channel-hub-docs'

type ChannelHubPageProps = {
    channel: HubChannel
    searchParams: HubSearchParams
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

export async function ChannelHubPage({
    channel,
    searchParams,
}: ChannelHubPageProps) {
    const t = await getTranslations('channelHub')
    const channelKey = getChannelKey(channel)
    const channelDocs = await getChannelHubDocs(channel)
    const { topic } = await searchParams
    const { topics, selected, docs, showFilters } = resolveHubTopics(
        channelDocs,
        topic
    )
    const latestDate = channelDocs[0]?.date
        ? getTime(channelDocs[0].date)
        : null

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
                    label: t('stats.latestUpdate'),
                    value: latestDate ?? t('stats.pending'),
                },
            ]}
            docs={docs}
            filters={
                showFilters || selected ? (
                    <HubTopicFilters
                        pathname={`/${channel}`}
                        topics={topics}
                        selected={selected?.value}
                        total={channelDocs.length}
                        labels={{
                            title: t('filters.title'),
                            all: t('filters.all'),
                            more: t('filters.more'),
                            less: t('filters.less'),
                        }}
                    />
                ) : null
            }
            resultsTitle={
                selected
                    ? t('filters.results', {
                          topic: selected.label,
                          count: docs.length,
                      })
                    : t('filters.total', { count: docs.length })
            }
            emptyTitle={t(`${channelKey}.empty.title`)}
            emptyDescription={t(`${channelKey}.empty.description`)}
        />
    )
}
