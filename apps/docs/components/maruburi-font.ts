import localFont from 'next/font/local'

export const maruburi = localFont({
    src: [
        {
            path: '../../../packages/ui/common/fonts/maruburi/MaruBuri-Bold.woff2',
        },
        {
            path: '../../../packages/ui/common/fonts/maruburi/MaruBuri-ExtraLight.woff2',
        },
        {
            path: '../../../packages/ui/common/fonts/maruburi/MaruBuri-Light.woff2',
        },
        {
            path: '../../../packages/ui/common/fonts/maruburi/MaruBuri-Regular.woff2',
        },
        {
            path: '../../../packages/ui/common/fonts/maruburi/MaruBuri-SemiBold.woff2',
        },
    ],
    variable: '--font-maru',
    display: 'swap',
})
