export type HubTopic = { value: string; label: string; count: number }

type TopicDocument = { tags?: readonly string[]; topicLabel?: string }
export type HubSearchParams = Promise<{ topic?: string | string[] }>

function normalizeTopic(value: string) {
    return value.normalize('NFKC').trim().toLowerCase()
}

function getDocumentTopics(doc: TopicDocument) {
    const tags = doc.tags?.filter((tag) => tag.trim()) ?? []
    return [
        ...new Set(
            (tags.length ? tags : [doc.topicLabel ?? ''])
                .map(normalizeTopic)
                .filter(Boolean)
        ),
    ]
}

const TOPIC_LABELS: Record<string, string> = {
    react: 'React',
    nextjs: 'Next.js',
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    ios: 'iOS',
    android: 'Android',
    v8: 'V8',
    'react-native': 'React Native',
    css: 'CSS',
    html: 'HTML',
}

export function resolveHubTopics<T extends TopicDocument>(
    docs: T[],
    rawTopic?: string | string[]
) {
    const counts = new Map<string, number>()
    for (const doc of docs) {
        for (const value of getDocumentTopics(doc)) {
            counts.set(value, (counts.get(value) ?? 0) + 1)
        }
    }
    const topics: HubTopic[] = Array.from(counts, ([value, count]) => ({
        value,
        label: Object.hasOwn(TOPIC_LABELS, value)
            ? TOPIC_LABELS[value]!
            : value,
        count,
    })).sort(
        (a, b) => b.count - a.count || a.value.localeCompare(b.value, 'en')
    )
    const candidate =
        typeof rawTopic === 'string' ? normalizeTopic(rawTopic) : ''
    const selected = topics.find((topic) => topic.value === candidate)

    return {
        topics,
        selected,
        docs: selected
            ? docs.filter((doc) =>
                  getDocumentTopics(doc).includes(selected.value)
              )
            : docs,
        showFilters: docs.length > 1 && topics.length > 1,
    }
}

export function getHubTopicHref(pathname: string, topic?: string) {
    return topic ? `${pathname}?${new URLSearchParams({ topic })}` : pathname
}

export function splitHubTopics(topics: HubTopic[], selected?: string) {
    const visible = topics.slice(0, 6)
    const active = topics.find((topic) => topic.value === selected)
    if (active && !visible.includes(active))
        visible[visible.length - 1] = active
    return {
        visible,
        remaining: topics.filter((topic) => !visible.includes(topic)),
    }
}
