import './globals.css'
import Header from './header'

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html className="size-full">
            <head>
                <script
                    src="https://unpkg.com/react-scan/dist/auto.global.js"
                    async
                />
            </head>
            <body className="size-full">
                <Header />
                {children}
            </body>
        </html>
    )
}
