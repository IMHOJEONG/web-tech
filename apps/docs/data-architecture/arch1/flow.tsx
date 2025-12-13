'use client'

import dynamic from 'next/dynamic'

const Flowbox = dynamic(() => import('./flow-box').then((mod) => mod.Flowbox), {
    ssr: false,
})
export const Flow = () => {
    return <Flowbox />
}
