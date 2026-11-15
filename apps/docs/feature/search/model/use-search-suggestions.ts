'use client'

import { useEffect, useState } from 'react'
import type { SearchSuggestionsResponse } from '~/lib/search-suggestions'
import { isSearchSuggestionsResponse } from '~/lib/search-suggestions'
import { normalizeSearchQuery } from '~/shared/lib/search-query'

type Outcome = {
    generation: number
    status: 'ready' | 'error'
    data?: SearchSuggestionsResponse
}

export function useSearchSuggestions(keyword: string, enabled: boolean) {
    const query = normalizeSearchQuery(keyword)
    const [attempt, setAttempt] = useState(0)
    const [outcome, setOutcome] = useState<Outcome | null>(null)
    const key = `${query}:${attempt}`
    const [cycle, setCycle] = useState({ key, enabled, generation: 0 })
    // Returning to a query or reopening the drawer starts a new request cycle.
    if (cycle.key !== key || cycle.enabled !== enabled)
        setCycle({ key, enabled, generation: cycle.generation + 1 })
    const generation = cycle.generation
    useEffect(() => {
        if (!enabled) return
        let current = true
        const controller = new AbortController()
        let timeout: ReturnType<typeof setTimeout> | undefined
        const timer = setTimeout(
            async () => {
                timeout = setTimeout(() => controller.abort(), 8_000)
                try {
                    const response = await fetch(
                        `/api/search/suggestions?${new URLSearchParams({ q: query })}`,
                        { signal: controller.signal, cache: 'no-store' }
                    )
                    if (!response.ok) throw new Error('Search unavailable')
                    const data: unknown = await response.json()
                    if (
                        !isSearchSuggestionsResponse(data) ||
                        data.query !== query
                    )
                        throw new Error('Invalid search response')
                    if (current)
                        setOutcome({ generation, status: 'ready', data })
                } catch {
                    if (current) setOutcome({ generation, status: 'error' })
                } finally {
                    clearTimeout(timeout)
                }
            },
            query ? 250 : 0
        )
        return () => {
            current = false
            clearTimeout(timer)
            clearTimeout(timeout)
            controller.abort()
        }
    }, [enabled, query, key, generation])
    const visible =
        enabled && outcome?.generation === generation ? outcome : null
    return {
        query,
        status: !enabled ? 'idle' : (visible?.status ?? 'loading'),
        data: visible?.data,
        retry: () => setAttempt((value) => value + 1),
    }
}
