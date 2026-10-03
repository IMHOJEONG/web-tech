'use client'

import { SpeedInsights } from '@vercel/speed-insights/next'
import { redactPerformanceUrl } from '~/lib/runtime-observation'

export function PerformanceInsights() {
    return (
        <SpeedInsights
            debug={false}
            beforeSend={(event) => {
                const url = redactPerformanceUrl(event.url)
                return url ? { ...event, url } : null
            }}
        />
    )
}
