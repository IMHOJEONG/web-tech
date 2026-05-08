function MdxLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="p-3">
            <div className="prose">{children}</div>
        </div>
    )
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <MdxLayout>{children}</MdxLayout>
}
