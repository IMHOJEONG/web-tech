import type { MDXComponents } from 'mdx/types'
import Image, { type ImageProps } from 'next/image'

export const components = {
    h1: ({ children }) => <h1 className="mdx-h1">{children}</h1>,
    h2: ({ children }) => <h2 className="mdx-h2">{children}</h2>,
    h3: ({ children }) => <h3 className="mdx-h3">{children}</h3>,
    h4: ({ children }) => <h4 className="mdx-h4">{children}</h4>,
    p: ({ children }) => <p className="mdx-p">{children}</p>,

    ul: ({ children }) => <ul className="mdx-ul">{children}</ul>,
    ol: ({ children }) => <ol className="mdx-ol">{children}</ol>,
    li: ({ children }) => <li className="mdx-li">{children}</li>,

    a: (props) => <a {...props} className="mdx-a" />,

    blockquote: ({ children }) => (
        <blockquote className="mdx-blockquote">{children}</blockquote>
    ),

    code: ({ children }) => <code className="mdx-inline-code">{children}</code>,

    pre: ({ children }) => <pre className="mdx-code-block">{children}</pre>,

    img: (props) => (
        <Image
            className="mdx-img"
            sizes="100vw"
            width={0}
            height={0}
            style={{ width: '100%', height: 'auto' }}
            {...(props as ImageProps)}
        />
    ),
} satisfies MDXComponents
