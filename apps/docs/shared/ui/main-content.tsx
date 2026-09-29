import type { ComponentProps } from 'react'
import { cn } from '@web-tech/ui/lib/utils'

export function MainContent({
    className,
    ...props
}: Omit<ComponentProps<'main'>, 'id' | 'tabIndex'>) {
    return (
        <main
            {...props}
            id="main-content"
            tabIndex={-1}
            className={cn('scroll-mt-20', className)}
        />
    )
}
