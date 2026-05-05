import { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import NextTopLoader from 'nextjs-toploader'
import { Suspense } from 'react'
import { mono } from '~/components/mono-font'

import Script from 'next/script'
import './css/global.css'

import { cn } from '@web-tech/ui/lib/utils'
import Footer from '~/widgets/app-shell/ui/footer'
import Header from '~/widgets/app-shell/ui/header'
import MobileBottomNav from '~/widgets/app-shell/ui/mobile-bottom-nav'

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-body',
})

const pretendard = localFont({
    src: '../public/fonts/PretendardVariable.woff2',
    display: 'swap',
    weight: '45 920',
    variable: '--font-body-ko',
})

const spaceGrotesk = localFont({
    src: '../public/fonts/SpaceGroteskVariable.woff2',
    weight: '300 700',
    display: 'swap',
    variable: '--font-display',
})

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('metadata.site')

    return {
        title: t('title'),
        description: t('description'),
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            images: ['/og-image.png'],
        },
        twitter: {
            card: 'summary_large_image',
            title: t('ogTitle'),
            description: t('ogDescription'),
            images: ['/og-image.png'],
        },
    }
}

export default async function Layout({
    children,
}: {
    children: React.ReactNode
}) {
    const locale = await getLocale()
    const messages = await getMessages()

    return (
        <html lang={locale} className="size-full">
            <head>
                <script
                    src="https://unpkg.com/react-scan/dist/auto.global.js"
                    async
                />
            </head>
            <NextIntlClientProvider locale={locale} messages={messages}>
                <body
                    className={cn(
                        'flex size-full min-h-screen flex-col',
                        mono.variable,
                        inter.variable,
                        pretendard.variable,
                        spaceGrotesk.variable
                    )}
                >
                    <Suspense>
                        <Header />
                    </Suspense>
                    <NextTopLoader showSpinner={false} />
                    <div className="flex-1 pb-[4.0625rem] sm:pb-0">
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
