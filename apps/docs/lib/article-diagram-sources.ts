const portraitHeights = {
    stages: 1096,
    completion: 1028,
    'local-architecture': 1240,
    'service-infrastructure': 1364,
} as const

export function getArticleDiagramSources(src: unknown) {
    if (typeof src !== 'string') return null
    const match =
        /^\/diagrams\/http-response-(stages|completion|local-architecture|service-infrastructure)\.png$/.exec(
            src
        )
    if (!match) return null
    const name = match[1] as keyof typeof portraitHeights
    return {
        portrait: src,
        landscape: src.replace('.png', '-wide.png'),
        portraitHeight: portraitHeights[name],
    }
}
