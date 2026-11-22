import { realpath } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

type ImageNode = {
    type: string
    tagName?: string
    properties?: Record<string, unknown>
    children?: ImageNode[]
}

function positiveDimension(value: unknown) {
    const dimension = Number(value)
    return Number.isFinite(dimension) && dimension > 0 ? dimension : undefined
}

// Inspect public files only. Remote images can supply dimensions in the MDX.
export function rehypeImageDimensions({
    publicRoot = path.resolve('public'),
}: { publicRoot?: string } = {}) {
    async function addDimensions(properties: Record<string, unknown>) {
        const width = positiveDimension(properties.width)
        const height = positiveDimension(properties.height)
        const src = properties.src
        if (
            (width && height) ||
            typeof src !== 'string' ||
            !src.startsWith('/') ||
            src.startsWith('//')
        )
            return

        try {
            // Public image files are included explicitly in next.config.mjs.
            // Keep dynamic, realpath-checked lookups out of whole-app tracing.
            const root = await realpath(/* turbopackIgnore: true */ publicRoot)
            const pathname = decodeURIComponent(src.split(/[?#]/)[0]!)
            const file = await realpath(
                /* turbopackIgnore: true */ path.resolve(root, `.${pathname}`)
            )
            if (!file.startsWith(root + path.sep)) return
            const { autoOrient } = await sharp(file).metadata()
            const { width: intrinsicWidth, height: intrinsicHeight } =
                autoOrient
            if (!intrinsicWidth || !intrinsicHeight) return
            properties.width =
                width ??
                (height
                    ? Math.round((height * intrinsicWidth) / intrinsicHeight)
                    : intrinsicWidth)
            properties.height =
                height ??
                (width
                    ? Math.round((width * intrinsicHeight) / intrinsicWidth)
                    : intrinsicHeight)
        } catch {
            // Missing or unsupported assets keep the browser's normal fallback.
        }
    }

    return async function visit(node: ImageNode): Promise<void> {
        if (
            node.type === 'element' &&
            node.tagName === 'img' &&
            node.properties
        ) {
            await addDimensions(node.properties)
        }
        await Promise.all(node.children?.map(visit) ?? [])
    }
}
