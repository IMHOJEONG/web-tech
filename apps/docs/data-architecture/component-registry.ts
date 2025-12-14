// data-architecture/component-registry.ts
export type MDXComponentsMap = Record<string, React.ComponentType<any>>

export async function getComponentsBySlug(
    slug: string
): Promise<MDXComponentsMap> {
    switch (slug) {
        case 'flow': {
            const mod = await import('./arch1/flow')
            return { Flow: mod.Flow }
        }

        case 'demo': {
            const mod = await import('./arch1/demo')
            return { Example: mod.Demo }
        }

        default:
            return {}
    }
}
