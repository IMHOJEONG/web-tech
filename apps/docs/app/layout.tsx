import { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import NextTopLoader from 'nextjs-toploader'
import { Suspense } from 'react'
import { maruburi } from '~/components/maruburi-font'
import { mono } from '~/components/mono-font'

import Script from 'next/script'
import Footer from '~/shared/layout/footer'
import Header from '~/shared/layout/header'
import MobileBottomNav from '~/shared/layout/mobile-bottom-nav'
import './css/global.css'

import { cn } from '@web-tech/ui/lib/utils'

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-body',
})

const spaceGrotesk = localFont({
    src: '../public/Space_Grotesk/SpaceGrotesk-VariableFont_wght.ttf',
    weight: '300 700',
    display: 'swap',
    variable: '--font-display',
})

export const metadata: Metadata = {
    title: 'HeapForge - Where memory meets mastery.',
    description: '기술은 정말 중요하고, 꾸준히 배워서 적용해야 합니다!',
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ko" className="size-full">
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
            <NextIntlClientProvider>
                <body
                    className={cn(
                        'flex size-full min-h-screen flex-col',
                        maruburi.variable,
                        mono.variable,
                        inter.variable,
                        spaceGrotesk.variable
                    )}
                >
                    <Suspense>
                        <Header />
                    </Suspense>
                    <NextTopLoader />
                    <div className="flex-1 pb-[4.0625rem] md:pb-0">
                        {children}
                    </div>
                    <Footer />
                    <MobileBottomNav />
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
