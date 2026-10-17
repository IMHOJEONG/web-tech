import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        id: '/',
        name: 'HEAP-FORGE',
        short_name: 'HEAP-FORGE',
        start_url: '/about',
        display: 'standalone',
        icons: [
            {
                src: '/favicon.png',
                sizes: '1024x1024',
                type: 'image/png',
                purpose: 'any',
            },
        ],
    }
}
