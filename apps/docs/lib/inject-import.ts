import matter from 'gray-matter'

export function injectImport(source: string) {
    const { content, data } = matter(source)

    if (!data.use) return source

    const imports = data.use.map(
        ({ name, from }: { name: string; from: 'mdx' | 'tsx' }) => {
            const dir = from === 'mdx' ? 'partials' : 'components'
            const ext = from === 'mdx' ? 'mdx' : 'tsx'

            return `import ${name} from './${dir}/${name}.${ext}'`
        }
    )

    return `${imports.join('\n')}\n\n${content}`
}
