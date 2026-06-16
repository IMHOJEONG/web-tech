'use client'

import { getMDXComponent } from 'mdx-bundler/client'
import { MDXComponents } from 'mdx/types'

export const ArchitecturePage = ({
    code,
    components,
}: {
    code: string
    components?: MDXComponents
}) => {
    /* eslint-disable react-hooks/static-components */
    const Component = getMDXComponent(code)
    const element = <Component components={components} />
    /* eslint-enable react-hooks/static-components */

    return element
}
