import type { ReactNode } from 'react'
import {
    getCodeDisclosure,
    getCodeDisclosureSummary,
} from '../lib/code-disclosure'
import { highlightCode } from '../lib/highlight-code'
import { CodeCopyButton } from './code-copy-button'

interface CodeBlockFrameProps {
    code: string
    language: string
    children: ReactNode
}

export function CodeBlockFrame({
    code,
    language,
    children,
}: CodeBlockFrameProps) {
    const disclosure = getCodeDisclosure(code)

    return (
        <figure
            className={`mdx-code-frame${disclosure.collapsible ? ' mdx-code-frame--collapsible' : ''}`}
        >
            <CodeCopyButton code={code} className="mdx-code-copy-button" />
            {disclosure.collapsible ? (
                <>
                    <details className="mdx-code-disclosure">
                        <summary
                            dangerouslySetInnerHTML={{
                                __html: getCodeDisclosureSummary(
                                    disclosure.lineCount,
                                    language
                                ),
                            }}
                        />
                        {children}
                    </details>
                    <pre className="mdx-code-block mdx-code-preview">
                        <code
                            dangerouslySetInnerHTML={{
                                __html: highlightCode(
                                    disclosure.preview,
                                    language
                                ),
                            }}
                        />
                    </pre>
                </>
            ) : (
                children
            )}
            {!disclosure.collapsible && (
                <figcaption className="mdx-code-frame__language">
                    {language}
                </figcaption>
            )}
        </figure>
    )
}
