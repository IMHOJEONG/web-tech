import React, { isValidElement } from 'react'
import { PropsWithChildren, ReactNode } from 'react'
import { codeToHtml } from 'shiki'

export default async function CodeBlock(
    props: PropsWithChildren<{ className?: string }>
) {
    const { children } = props

    const codeElement = React.Children.toArray(children)[0]
    const isCodeElement =
        isValidElement(codeElement) && codeElement.type === 'code'
    const code = isCodeElement ? codeElement?.props?.children : null
    const lang = isCodeElement
        ? codeElement?.props?.className.replace('language-', '')
        : 'text'
    const out = await codeToHtml(code, { lang, theme: 'github-dark' })

    return (
        <div
            dangerouslySetInnerHTML={{ __html: out }}
            style={{
                margin: '1rem 0',
                borderRadius: '8px',
                overflow: 'hidden',
                fontFamily: 'Fira Code, monospace',
            }}
        />
    )
}
