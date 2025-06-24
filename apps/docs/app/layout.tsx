import { Metadata } from 'next'
import { maruburi } from '~/components/maruburi-font'
import { mono } from '~/components/mono-font'
import './globals.css'
import Header from './header'

export const metadata: Metadata = {
    title: 'HeapForge - Where memory meets mastery.',
    description: '기술은 정말 중요하고, 꾸준히 배워서 적용해야 합니다!',
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html>
            <head>
                <meta
                    property="og:title"
                    content="HeapForge – Where Memory Meets Mastery"
                />
                <meta
                    property="og:description"
                    content="HeapForge is a developer's foundry of deep system insights, memory internals, and software craftsmanship. From bytes to architecture — forge your knowledge."
                />
                <meta property="og:image" content="/og-image.png" />
                <meta
                    name="description"
                    content="HeapForge is a blog dedicated to systems programming, memory internals, and software design. Explore in-depth guides and engineering insights."
                />

                <script
                    src="https://unpkg.com/react-scan/dist/auto.global.js"
                    async
                />
            </head>
            <body
                className={`flex flex-col size-full min-h-screen bg-gradient-to-b from-amber-50 to-stone-100 ${maruburi.variable} ${mono.variable}`}
            >
                <Header />
                {children}
            </body>
        </html>
    )
}
