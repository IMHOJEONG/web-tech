export type SearchRankableDoc = {
    title?: string
    summary?: string
    slug: string
    fileName: string
    section: string
    content: string
    date?: string
}

type SearchMatch<T extends SearchRankableDoc> = {
    doc: T
    score: number
}

function normalizeSearchText(value?: string) {
    return value?.toLowerCase().replace(/\s+/g, ' ').trim() ?? ''
}

function tokenizeSearchText(value: string) {
    return normalizeSearchText(value)
        .split(/[\s/_-]+/)
        .map((token) => token.trim())
        .filter(Boolean)
}

function scoreField(
    value: string,
    query: string,
    tokens: string[],
    weights: {
        exact: number
        prefix: number
        includes: number
        token: number
    }
) {
    if (!value) {
        return 0
    }

    let score = 0

    if (value === query) {
        score += weights.exact
    } else if (value.startsWith(query)) {
        score += weights.prefix
    } else if (value.includes(query)) {
        score += weights.includes
    }

    for (const token of tokens) {
        if (value.includes(token)) {
            score += weights.token
        }
    }

    return score
}

function hasAllTokens(haystack: string, tokens: string[]) {
    return tokens.every((token) => haystack.includes(token))
}

function getDateScore(date?: string) {
    if (!date) {
        return 0
    }

    const timestamp = new Date(date).getTime()

    if (Number.isNaN(timestamp)) {
        return 0
    }

    return Math.floor(timestamp / 86_400_000)
}

export function scoreSearchDoc(
    doc: SearchRankableDoc,
    keyword: string
): number {
    const query = normalizeSearchText(keyword)

    if (!query) {
        return 0
    }

    const tokens = tokenizeSearchText(query)

    if (!tokens.length) {
        return 0
    }

    const title = normalizeSearchText(doc.title)
    const summary = normalizeSearchText(doc.summary)
    const section = normalizeSearchText(doc.section)
    const slug = normalizeSearchText(doc.slug)
    const fileName = normalizeSearchText(doc.fileName.replace(/\//g, ' '))
    const content = normalizeSearchText(doc.content)
    const haystack = [title, summary, section, slug, fileName, content]
        .filter(Boolean)
        .join(' ')

    if (!hasAllTokens(haystack, tokens)) {
        return 0
    }

    let score = 0

    score += scoreField(title, query, tokens, {
        exact: 600,
        prefix: 420,
        includes: 300,
        token: 72,
    })
    score += scoreField(summary, query, tokens, {
        exact: 280,
        prefix: 220,
        includes: 160,
        token: 36,
    })
    score += scoreField(section, query, tokens, {
        exact: 180,
        prefix: 140,
        includes: 100,
        token: 28,
    })
    score += scoreField(slug, query, tokens, {
        exact: 220,
        prefix: 180,
        includes: 120,
        token: 32,
    })
    score += scoreField(fileName, query, tokens, {
        exact: 140,
        prefix: 110,
        includes: 84,
        token: 20,
    })
    score += scoreField(content, query, tokens, {
        exact: 60,
        prefix: 32,
        includes: 20,
        token: 8,
    })

    if (title && tokens.every((token) => title.includes(token))) {
        score += 120
    }

    if (summary && tokens.every((token) => summary.includes(token))) {
        score += 48
    }

    return score
}

export function rankSearchDocs<T extends SearchRankableDoc>(
    docs: T[],
    keyword: string
) {
    const matches: SearchMatch<T>[] = docs
        .map((doc) => ({
            doc,
            score: scoreSearchDoc(doc, keyword),
        }))
        .filter((match) => match.score > 0)

    matches.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score
        }

        return getDateScore(b.doc.date) - getDateScore(a.doc.date)
    })

    return matches.map((match) => match.doc)
}
