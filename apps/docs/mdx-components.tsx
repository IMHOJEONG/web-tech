import type { MDXComponents } from 'mdx/types'
import Image, { type ImageProps } from 'next/image'

export function slugifyHeading(title: string) {
    return (
        title
            .trim()
            .toLowerCase()
            // 괄호, 물음표, 느낌표 등 특수문자 제거
            .replace(/[^\p{L}\p{N}\s-]/gu, '')
            // 공백을 - 로 변환
            .replace(/\s+/g, '-')
            // 연속된 하이픈 정리
            .replace(/-+/g, '-')
    )
}

export const components = {
    h1: ({ children }) => (
        <h1 className="mdx-h1 scroll-mt-24" id={slugifyHeading(children)}>
            {children}
        </h1>
    ),
    h2: ({ children }) => (
        <h2 className="mdx-h2 scroll-mt-24" id={slugifyHeading(children)}>
            {children}
        </h2>
    ),
    h3: ({ children }) => (
        <h3 className="mdx-h3 scroll-mt-24" id={slugifyHeading(children)}>
            {children}
        </h3>
    ),
    h4: ({ children }) => (
        <h4 className="mdx-h4 scroll-mt-24" id={slugifyHeading(children)}>
            {children}
        </h4>
    ),
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
