'use client'

import dynamic from 'next/dynamic'

const FlowClient = dynamic(
    () => import('./flow-client').then((mod) => mod.FlowClient),
    {
        ssr: false,
    }
)

export const Flow = () => {
    return <FlowClient />
}
