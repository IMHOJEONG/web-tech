export function DocumentMetaText({ items }: { items: string[] }) {
    return (
        <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-6 text-on-surface-variant">
            {items.map((item, index) => (
                <li key={`${item}:${index}`} className="break-words">
                    {index > 0 && (
                        <span aria-hidden="true" className="mr-3">
                            ·
                        </span>
                    )}
                    {item}
                </li>
            ))}
        </ul>
    )
}
