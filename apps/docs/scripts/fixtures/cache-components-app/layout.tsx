import { Suspense, type ReactNode } from 'react'

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body>
                <Suspense fallback={<p>Loading fixture</p>}>
                    {children}
                </Suspense>
            </body>
        </html>
    )
}
