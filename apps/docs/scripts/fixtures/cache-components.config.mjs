// Copied to the temporary app root only.
import base from './next.cache-base.mjs'

export default async function config(phase, context) {
    const resolved =
        typeof base === 'function' ? await base(phase, context) : base
    return { ...resolved, cacheComponents: true }
}
