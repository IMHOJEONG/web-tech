type CardLabelsInput = {
    section: string
    topicLabel?: string
    tags?: readonly string[]
}

function labelKey(value: string) {
    return value.normalize('NFKC').trim().toLowerCase()
}

export function getDocsIndexCardLabels({
    section,
    topicLabel,
    tags = [],
}: CardLabelsInput): string[] {
    const seen = new Set([labelKey(section)])
    const labels: string[] = []
    const topic = topicLabel?.trim()
    if (topic && !seen.has(labelKey(topic))) {
        seen.add(labelKey(topic))
        labels.push(topic)
    }

    let tagCount = 0
    for (const value of tags) {
        const tag = value.trim().replace(/^#/, '').trim()
        const key = labelKey(tag)
        if (!key || seen.has(key)) continue
        seen.add(key)
        labels.push(`#${tag}`)
        if (++tagCount === 2) break
    }
    return labels
}
