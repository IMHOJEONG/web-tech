import rehypeSlug from 'rehype-slug'
import { slugifyHeading } from './slugify-heading.ts'

type Root = Parameters<ReturnType<typeof rehypeSlug>>[0]
type Node = {
    type: string
    tagName?: string
    name?: string | null
    value?: string
    properties?: Record<string, unknown>
    attributes?: { type?: string; name?: string; value?: unknown }[]
    children?: Node[]
}

function record(value: unknown): Record<string, unknown> | undefined {
    return value !== null && typeof value === 'object'
        ? (value as Record<string, unknown>)
        : undefined
}

function authoredId(node: Node): string | undefined {
    const id = node.properties?.id
    if (typeof id === 'string' && id) return id
    if (typeof id === 'number' && Number.isFinite(id)) return String(id)
    const value = node.attributes?.find(
        (attribute) => attribute.name === 'id'
    )?.value
    if (typeof value === 'string' && value) return value
    // Read a literal JSX id without evaluating authored JavaScript.
    const program = record(record(record(value)?.data)?.estree)
    const statement = Array.isArray(program?.body)
        ? record(program.body[0])
        : undefined
    const expression = record(statement?.expression)
    if (expression?.type === 'Literal') {
        if (typeof expression.value === 'string') return expression.value
        if (
            typeof expression.value === 'number' &&
            Number.isFinite(expression.value)
        ) {
            return String(expression.value)
        }
    }
    if (
        expression?.type === 'TemplateLiteral' &&
        Array.isArray(expression.expressions) &&
        expression.expressions.length === 0 &&
        Array.isArray(expression.quasis)
    ) {
        const value = record(record(expression.quasis[0])?.value)?.cooked
        if (typeof value === 'string') return value
    }
    return undefined
}

function legacyChildren(node: Node): unknown {
    if (node.type === 'text') return node.value ?? ''
    return { props: { children: node.children?.map(legacyChildren) } }
}

function visit(node: Node, callback: (node: Node) => void) {
    callback(node)
    node.children?.forEach((child) => visit(child, callback))
}

export function rehypeArticleHeadings() {
    const slug = rehypeSlug()
    return (tree: Root, file: { data: Record<string, unknown> }) => {
        const used = new Set<string>()
        const headings: {
            node: Node
            depth: number
            authored?: string
            markdown: boolean
        }[] = []
        const legacy: { node: Node; id: string }[] = []

        // Reserve IDs throughout the article before assigning any generated ID.
        visit(tree, (node) => {
            const id = authoredId(node)
            if (id) used.add(id)
            const name = node.type === 'element' ? node.tagName : node.name
            const depth = name?.match(/^h([1-6])$/)?.[1]
            if (!depth) return
            const markdown = node.type === 'element'
            const jsx = ['mdxJsxFlowElement', 'mdxJsxTextElement'].includes(
                node.type
            )
            if (markdown) {
                if (id) node.properties = { ...node.properties, id }
            }
            // Do not replace a dynamic authored id whose value cannot be resolved statically.
            const dynamicId =
                jsx &&
                !id &&
                node.attributes?.some((attribute) => attribute.name === 'id')
            if (markdown || (jsx && !dynamicId)) {
                headings.push({
                    node,
                    depth: Number(depth),
                    authored: id,
                    markdown,
                })
            }
            if (Number(depth) <= 4 && (markdown || (jsx && !dynamicId))) {
                legacy.push({
                    node,
                    id: slugifyHeading(node.children?.map(legacyChildren)),
                })
            }
        })

        const legacyOwners = new Map<string, Node>()
        for (const { node, id } of legacy) {
            if (id && !used.has(id) && !legacyOwners.has(id))
                legacyOwners.set(id, node)
        }

        slug(tree)
        for (const heading of headings) {
            if (heading.authored) continue
            const base = heading.markdown
                ? String(heading.node.properties?.id || 'section')
                : slugifyHeading(heading.node.children?.map(legacyChildren)) ||
                  'section'
            let id = base
            let suffix = 0
            while (
                used.has(id) ||
                (legacyOwners.has(id) && legacyOwners.get(id) !== heading.node)
            ) {
                id = `${base}-${++suffix}`
            }
            if (heading.markdown)
                heading.node.properties = { ...heading.node.properties, id }
            else
                (heading.node.attributes ??= []).push({
                    type: 'mdxJsxAttribute',
                    name: 'id',
                    value: id,
                })
            used.add(id)
        }

        // Runtime TOC uses default remark-flexible-toc settings: only H1 is skipped.
        const targets = headings.filter(
            (heading) => heading.markdown && heading.depth !== 1
        )
        const toc = file.data.toc
        if (!Array.isArray(toc) || toc.length !== targets.length) {
            throw new Error('Article headings and TOC are out of sync')
        }
        toc.forEach((item, index) => {
            const target = targets[index]!
            const entry = record(item)
            if (entry?.depth !== target.depth) {
                throw new Error(
                    'Article heading depths and TOC are out of sync'
                )
            }
            entry.href = `#${target.node.properties!.id}`
        })

        // Authored IDs win; otherwise preserve the first target of old duplicate IDs.
        for (const [id, node] of legacyOwners) {
            if (used.has(id)) continue
            used.add(id)
            node.children?.unshift({
                type: 'element',
                tagName: 'span',
                properties: {
                    id,
                    className: ['mdx-heading-alias'],
                    ariaHidden: true,
                },
                children: [],
            })
        }
    }
}
