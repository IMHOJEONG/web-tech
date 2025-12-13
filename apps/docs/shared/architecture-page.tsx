'use client'

import { getMDXComponent } from 'mdx-bundler/client'
import { useMemo } from 'react'

export const ArchitecturePage = ({
    code,
    frontmatter,
}: {
    code: string
    frontmatter: {
        [key: string]: any
    }
}) => {
    const Component = useMemo(() => getMDXComponent(code), [code])
    return <Component />
}
