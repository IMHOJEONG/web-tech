import { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { Suspense } from 'react'
import { maruburi } from '~/components/maruburi-font'
import { mono } from '~/components/mono-font'

import Script from 'next/script'
import './css/global.css'
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

                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@6..144,1..1000&display=swap"
                    rel="stylesheet"
                />
            </head>
            <NextIntlClientProvider>
                <body
                    className={`flex flex-col size-full min-h-screen bg-gradient-to-b 
            
                    ${maruburi.variable} ${mono.variable}`}
                >
                    <Suspense>
                        <Header />
                    </Suspense>
                    {children}
                </body>
            </NextIntlClientProvider>
            <Script id="tailwindcss-dark-mode">
                {`
                    document.documentElement.classList.toggle(
                        "dark",
                        localStorage.theme === "dark" ||
                            (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches),
                        );
                `}
            </Script>
        </html>
    )
}
