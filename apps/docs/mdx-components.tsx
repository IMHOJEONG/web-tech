import { cn } from '@/lib/utils'
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

export const commonCss = [
    'dark:text-[var(--hf-text-primary)]',
    'text-[var(--hf-text-primary)]',
]

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

    blockquote: ({ children }) => (
        <blockquote className={cn('mdx-blockquote', ...commonCss)}>
            {children}
        </blockquote>
    ),

    code: ({ children }) => (
        <code className={cn('mdx-inline-code', ...commonCss)}>{children}</code>
    ),

    pre: ({ children }) => (
        <pre className={cn('mdx-code-block', ...commonCss)}>{children}</pre>
    ),

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
