export function shouldShowContentSourceBadge(nodeEnv = process.env.NODE_ENV) {
    return nodeEnv === 'development'
}
