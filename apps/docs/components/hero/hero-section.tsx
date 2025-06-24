import Node from './node'
import { LandingBox } from '../layout/landing-box'

export const HeroSection = () => {
    return (
        <LandingBox>
            <div className="flex justify-between flex-1">
                <div className="flex flex-col justify-center">
                    <h1
                        className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight to-neutral-600 dark:from-white dark:to-zinc-400
                    
                    text-transparent bg-clip-text bg-gradient-to-r from-zinc-700 via-zinc-500 to-zinc-300
                    "
                        lang="ko"
                    >
                        {/* Forge your ideas in memory. */}
                        기억 속 아이디어를 현실로 만드는 여정
                    </h1>
                    <div className="text-gray-500" lang="ko">
                        {/* is a space where software craftsmanship meets systems
                        thinking. From memory to architecture — forging
                        knowledge one byte at a time. */}
                        소프트웨어 장인정신과 시스템 사고가 만나는 공간입니다.
                        메모리부터 아키텍처까지 — 지식을 한 바이트씩 정제해
                        나갑니다.
                    </div>
                </div>
                <Node />
            </div>
        </LandingBox>
    )
}

// @font-face {
//   font-family: 'MyFont';
//   src: url('/fonts/MyFont.woff2') format('woff2'),
//        url('/fonts/MyFont.woff') format('woff'),
//        url('/fonts/MyFont.ttf') format('truetype'); /* fallback */
//   font-weight: normal;
//   font-style: normal;
// }
