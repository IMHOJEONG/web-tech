'use client'

import { getMDXComponent } from 'mdx-bundler/client'
import { MDXComponents } from 'mdx/types'
import { useMemo } from 'react'

export const ArchitecturePage = ({
    code,
    frontmatter,
    components,
}: {
    code: string
    frontmatter: {
        [key: string]: any
    }
    components?: MDXComponents
}) => {
    const Component = useMemo(() => getMDXComponent(code), [code])
    return <Component components={components} />
}
