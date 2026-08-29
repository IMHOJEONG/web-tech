import { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import localFont from 'next/font/local'
import NextTopLoader from 'nextjs-toploader'
import { Suspense } from 'react'
import { mono } from '~/components/mono-font'

import Script from 'next/script'
import './css/global.css'

import { cn } from '@web-tech/ui/lib/utils'
import {
    REACT_GRAB_SCRIPT_SRC,
    REACT_SCAN_SCRIPT_SRC,
    shouldLoadReactInspectionTools,
} from '~/shared/config/react-inspection-tools'
import { getMetadataBase } from '~/lib/seo'
import Footer from '~/widgets/app-shell/ui/footer'
import Header from '~/widgets/app-shell/ui/header'
import MobileBottomNav from '~/widgets/app-shell/ui/mobile-bottom-nav'

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

const shouldLoadInspectionTools = shouldLoadReactInspectionTools()

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('metadata.site')

    return {
        metadataBase: getMetadataBase(),
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
                {shouldLoadInspectionTools && (
                    <Script
                        src={REACT_SCAN_SCRIPT_SRC}
                        crossOrigin="anonymous"
                        strategy="beforeInteractive"
                    />
                )}
                {shouldLoadInspectionTools && (
                    <Script
                        src={REACT_GRAB_SCRIPT_SRC}
                        crossOrigin="anonymous"
                        strategy="beforeInteractive"
                    />
                )}
                <link rel="icon" href="/favicon.png" type="image/png" />
            </head>
            <NextIntlClientProvider locale={locale} messages={messages}>
                <body
                    className={cn(
                        'flex size-full min-h-screen flex-col',
                        mono.variable,
                        pretendard.variable,
                        spaceGrotesk.variable
                    )}
                >
                    <Suspense>
                        <Header />
                    </Suspense>
                    <NextTopLoader showSpinner={false} />
                    <div className="flex-1 pb-16.25 sm:pb-0">{children}</div>
                    <Footer />
                    <MobileBottomNav />
                </body>
            </NextIntlClientProvider>
            <Script id="tailwindcss-dark-mode">
                {`
                    const isDark =
                        localStorage.theme === "dark" ||
                        (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);

                    document.documentElement.classList.toggle("dark", isDark);
                `}
            </Script>
        </html>
    )
}
