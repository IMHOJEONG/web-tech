import { VFile } from 'vfile'
import { matter as vfileMatter } from 'vfile-matter'

export function injectImport(source: string) {
    const vfile = new VFile({ value: source })
    vfileMatter(vfile, { strip: true })
    const data = vfile.data.matter || {}
    const content = String(vfile)

    if (!Array.isArray(data.use)) return source

    const imports = data.use.map((entry) => {
        const { name, from } = entry as { name: string; from: 'mdx' | 'tsx' }
        const dir = from === 'mdx' ? 'partials' : 'components'
        const ext = from === 'mdx' ? 'mdx' : 'tsx'
        return `import { ${name} } from './${dir}/${name}.${ext}'`
    })

    return `${imports.join('\n')}\n\n${content}`
}
