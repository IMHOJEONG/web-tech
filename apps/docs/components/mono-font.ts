import localFont from 'next/font/local'

export const mono = localFont({
    src: [
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-Bold.woff2',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-BoldItalic.woff2',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-ExtraBold.woff2',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-ExtraBoldItalic.woff2',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-ExtraLight.woff2',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-Italic.woff2',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-Light.woff2',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-LightItalic.woff2',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-Medium.woff2',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-MediumItalic.woff2',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-Regular.woff2',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-SemiBold.woff2',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-SemiBoldItalic.woff2',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-Thin.woff2',
        },
        {
            path: '../../../packages/ui/common/fonts/jetbrains-mono/JetBrainsMono-ThinItalic.woff2',
        },
    ],
    variable: '--font-jetbrains-mono',
    display: 'swap',
})
