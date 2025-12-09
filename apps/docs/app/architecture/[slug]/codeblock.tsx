import React, { isValidElement, PropsWithChildren } from 'react'
import { codeToHtml } from 'shiki'

export default async function CodeBlock(
    props: PropsWithChildren<{ className?: string }>
) {
    const { children } = props

    const codeElement = React.Children.toArray(
        children
    )[0] as React.ReactElement<{
        children?: React.ReactNode
        className?: string
    }>
    const isCodeElement =
        isValidElement(codeElement) && codeElement.type === 'code'

    const rawCode = isCodeElement ? codeElement?.props?.children : ''
    const code =
        typeof rawCode === 'string'
            ? rawCode
            : Array.isArray(rawCode)
              ? rawCode.join('')
              : String(rawCode ?? '')

    const rawLang = isCodeElement ? (codeElement?.props?.className ?? '') : ''
    const langMatch = rawLang.match(/language-(\w+)/)
    const lang = langMatch ? langMatch[1] : 'text'

    const out = await codeToHtml(code, {
        lang: lang || 'text',
        theme: 'github-dark',
    })

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
