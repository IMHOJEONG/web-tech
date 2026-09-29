type ArticleNode = {
    type: string
    tagName?: string
    name?: string | null
    children?: ArticleNode[]
}

function hasTitle(node: ArticleNode): boolean {
    if (node.type === 'element' && node.tagName === 'h1') return true
    if (
        (node.type === 'mdxJsxFlowElement' ||
            node.type === 'mdxJsxTextElement') &&
        node.name === 'h1'
    ) {
        return true
    }
    return node.children?.some(hasTitle) ?? false
}

// Inspect parsed nodes so fenced code and frontmatter cannot count as a title.
export function rehypeArticleTitle() {
    return (tree: ArticleNode, file: { data: Record<string, unknown> }) => {
        file.data.hasTitle = hasTitle(tree)
    }
}
