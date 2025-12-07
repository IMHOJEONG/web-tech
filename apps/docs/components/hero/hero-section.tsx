'use client'

import dynamic from 'next/dynamic'
import { HERO } from '~/shared/constants'
import { LandingBox } from '../layout/landing-box'

const Node = dynamic(() => import('../react-flow/node'), { ssr: false })

export const HeroSection = () => {
    return (
        <LandingBox>
            <div className="grid grid-cols-[0.5fr_1fr] justify-between ">
                <div className="flex flex-col justify-center">
                    <h1
                        className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight to-neutral-600 dark:from-white dark:to-zinc-400

                    text-transparent bg-clip-text bg-gradient-to-r from-zinc-700 via-zinc-500 to-zinc-300
                    "
                    >
                        {HERO.title}
                    </h1>
                    <div className="text-gray-500" lang="ko">
                        {HERO.description}
                    </div>
                </div>
                <Node />
            </div>
        </LandingBox>
    )
}
