import localFont from 'next/font/local'

export const mono = localFont({
    src: [
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-Bold.woff2',
            weight: '700',
            style: 'normal',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-BoldItalic.woff2',
            weight: '700',
            style: 'italic',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-ExtraBold.woff2',
            weight: '800',
            style: 'normal',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-ExtraBoldItalic.woff2',
            weight: '800',
            style: 'italic',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-ExtraLight.woff2',
            weight: '200',
            style: 'normal',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-ExtraLightItalic.woff2',
            weight: '200',
            style: 'italic',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-Italic.woff2',
            weight: '400',
            style: 'italic',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-Light.woff2',
            weight: '300',
            style: 'normal',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-LightItalic.woff2',
            weight: '300',
            style: 'italic',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-Medium.woff2',
            weight: '500',
            style: 'normal',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-MediumItalic.woff2',
            weight: '500',
            style: 'italic',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-Regular.woff2',
            weight: '400',
            style: 'normal',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-SemiBold.woff2',
            weight: '600',
            style: 'normal',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-SemiBoldItalic.woff2',
            weight: '600',
            style: 'italic',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-Thin.woff2',
            weight: '100',
            style: 'normal',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-ThinItalic.woff2',
            weight: '100',
            style: 'italic',
        },
    ],
    variable: '--font-jetbrains-mono',
    display: 'swap',
})
