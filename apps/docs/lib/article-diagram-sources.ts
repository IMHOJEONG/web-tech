const diagramHeights = {
    stages: { portrait: 1096, landscape: 540 },
    completion: { portrait: 1028, landscape: 620 },
    'local-architecture': { portrait: 1240, landscape: 740 },
    'service-infrastructure': { portrait: 1364, landscape: 600 },
} as const

export function getArticleDiagramSources(src: unknown) {
    if (typeof src !== 'string') return null
    const match =
        /^\/diagrams\/http-response-(stages|completion|local-architecture|service-infrastructure)\.png$/.exec(
            src
        )
    if (!match) return null
    const name = match[1] as keyof typeof diagramHeights
    return {
        portrait: src,
        landscape: src.replace('.png', '-wide.png'),
        portraitHeight: diagramHeights[name].portrait,
        landscapeHeight: diagramHeights[name].landscape,
    }
}
