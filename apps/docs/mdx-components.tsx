import { cn } from '@web-tech/ui/lib/utils'
import type { MDXComponents } from 'mdx/types'
import Image, { type ImageProps } from 'next/image'
import { isValidElement, type ReactNode } from 'react'
import {
    getCalloutVariantFromChildren,
    getNodeTextContent,
    stripCalloutMarkerFromNode,
} from '~/feature/callout/model/react-callout'
import { getCalloutLabel } from '~/feature/callout/model/callout'
import { highlightCode } from '~/feature/code-block/lib/highlight-code'
import { CodeCopyButton } from '~/feature/code-block/ui/code-copy-button'
import { slugifyHeading } from '~/lib/slugify-heading'

export const commonCss = [
    'dark:text-[var(--hf-text-primary)]',
    'text-[var(--hf-text-primary)]',
]

function getCodeText(node: ReactNode): string {
    return getNodeTextContent(node)
}

function getCodeLanguage(node: ReactNode): string {
    if (!isValidElement<{ className?: string; children?: ReactNode }>(node)) {
        return 'CODE'
    }

    const className = node.props.className ?? ''
    const language = className
        .split(/\s+/)
        .find((value) => value.startsWith('language-'))
        ?.replace('language-', '')
        .trim()

    return language ? language.toUpperCase() : 'CODE'
}

export const components = {
    h1: ({ children }) => (
        <h1
            className={cn('mdx-h1 scroll-mt-24', ...commonCss)}
            id={slugifyHeading(children)}
        >
            {children}
        </h1>
    ),
    h2: ({ children }) => (
        <h2
            className={cn('mdx-h2 scroll-mt-24', ...commonCss)}
            id={slugifyHeading(children)}
        >
            {children}
        </h2>
    ),
    h3: ({ children }) => (
        <h3
            className={cn('mdx-h3 scroll-mt-24', ...commonCss)}
            id={slugifyHeading(children)}
        >
            {children}
        </h3>
    ),
    h4: ({ children }) => (
        <h4
            className={cn('mdx-h4 scroll-mt-24', ...commonCss)}
            id={slugifyHeading(children)}
        >
            {children}
        </h4>
    ),
    p: ({ children }) => (
        <p className={cn('mdx-p', ...commonCss)}>{children}</p>
    ),

    ul: ({ children }) => (
        <ul className={cn('mdx-ul', ...commonCss)}>{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className={cn('mdx-ol', ...commonCss)}>{children}</ol>
    ),
    li: ({ children }) => (
        <li className={cn('mdx-li', ...commonCss)}>{children}</li>
    ),

    a: (props) => <a {...props} className={cn('mdx-a', ...commonCss)} />,

    blockquote: ({ children }) => {
        const calloutVariant = getCalloutVariantFromChildren(children)

        if (calloutVariant) {
            const strippedChildren = stripCalloutMarkerFromNode(children).node
            const label = getCalloutLabel(calloutVariant)

            return (
                <aside
                    aria-label={label}
                    className={cn(
                        'mdx-callout',
                        `mdx-callout--${calloutVariant}`,
                        ...commonCss
                    )}
                    role="note"
                >
                    <p className="mdx-callout__label">{label}</p>
                    <div className="mdx-callout__content">
                        {strippedChildren}
                    </div>
                </aside>
            )
        }

        return (
            <blockquote className={cn('mdx-blockquote', ...commonCss)}>
                {children}
            </blockquote>
        )
    },

    table: ({ children }) => (
        <div
            className="mdx-table-scroll"
            role="region"
            aria-label="문서 표"
            tabIndex={0}
        >
            <table className="mdx-table">{children}</table>
        </div>
    ),

    code: ({ children, className, ...props }) => {
        const isInline =
            !className &&
            (typeof children === 'string' || typeof children === 'number')

        return (
            <code
                {...props}
                className={cn(isInline && 'mdx-inline-code', className)}
            >
                {children}
            </code>
        )
    },

    pre: ({ children, className, ...props }) => {
        if (className?.includes('shiki')) {
            return (
                <pre {...props} className={className}>
                    {children}
                </pre>
            )
        }

        const code = getCodeText(children)
        const language = getCodeLanguage(children)

        return (
            <figure className="mdx-code-frame">
                <CodeCopyButton code={code} className="mdx-code-copy-button" />
                <pre {...props} className={cn('mdx-code-block', commonCss)}>
                    <code
                        className="mdx-code-block__code"
                        dangerouslySetInnerHTML={{
                            __html: highlightCode(code, language),
                        }}
                    />
                </pre>
                <figcaption className="mdx-code-frame__language">
                    {language}
                </figcaption>
            </figure>
        )
    },

    img: (props) => (
        <Image
            className={cn('mdx-img', ...commonCss)}
            sizes="100vw"
            width={0}
            height={0}
            style={{ width: '100%', height: 'auto' }}
            priority
            placeholder="blur"
            blurDataURL="/image/blur-image.webp"
            {...(props as ImageProps)}
        />
    ),
} satisfies MDXComponents
