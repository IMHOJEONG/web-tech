export function SkipLink({ label }: { label: string }) {
    return (
        <a
            href="#main-content"
            className="sr-only fixed left-3 top-3 z-[100] rounded-lg bg-background text-on-surface shadow-lg focus:not-sr-only focus:fixed focus:px-4 focus:py-3"
        >
            {label}
        </a>
    )
}
