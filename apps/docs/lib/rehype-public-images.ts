type ImageNode = {
    type: string
    tagName?: string
    properties?: { src?: unknown }
    children?: ImageNode[]
}

// File previews resolve relative assets; the website serves the same assets at /.
export function normalizePublicImageSource(src: string) {
    const match = src.match(
        /^(?:\.\.\/)+public\/((?:[\w-]+\/)*[\w-]+\.(?:png|jpe?g|webp|gif|svg))$/
    )
    return match ? `/${match[1]}` : src
}

export function rehypePublicImages() {
    return function visit(node: ImageNode): void {
        if (node.type === 'element' && node.tagName === 'img') {
            const src = node.properties?.src
            if (typeof src === 'string') {
                if (node.properties)
                    node.properties.src = normalizePublicImageSource(src)
            }
        }
        node.children?.forEach(visit)
    }
}
