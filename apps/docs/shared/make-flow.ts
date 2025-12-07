export const makeID = (arr: string[]) => arr.join('-')

export const makeEdge = ({
    source,
    target,
}: {
    source: string
    target: string
}) => `${source}->${target}`
