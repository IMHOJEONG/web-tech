import fs from 'fs'
import { bundleMDX } from 'mdx-bundler'
import path from 'path'
import { Suspense } from 'react'
import { TocItem } from 'remark-flexible-toc' // <---------
import { getArchitecturesData } from '~/lib/get-architecture'
import { injectImport } from '~/lib/inject-import'
import { ArchitecturePage } from '~/shared/architecture-page'
import { LoadingComponent } from '~/shared/loading-component'
type Scope = {
    readingTime: string
    toc?: TocItem[]
}

type Frontmatter = {
    title: string
    author: string
}

import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const CONTENT_ROOT = path.resolve(
    __dirname,
    '../../../data-architecture/arch1'
)
const EXTERNALS = [
    // Next
    'next/*',

    // UI / DOM libs
    '@xyflow/react',
    '@xyflow/react/*',
    'reactflow',

    // styling
    '*.css',
]

export default async function Page({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const data = await getArchitecturesData()
    const target = data.find((doc) => doc.slug == slug)
    console.log(slug, target?.fileName)

    const withImports = injectImport(target?.content ?? '')

    // const cwd = path.join(process.cwd(), './data-architecture/arch1')
    const result = await bundleMDX({
        source: withImports,
        cwd: CONTENT_ROOT,
        files: {
            './flow.tsx': fs.readFileSync(
                path.join(CONTENT_ROOT, 'flow.tsx'),
                'utf8'
            ),
        },
        esbuildOptions(options) {
            options.external = [...(options.external ?? []), ...EXTERNALS]
            return options
        },
    })

    const { code, frontmatter } = result

    return (
        <div className="flex gap-4">
            {/* <div className="sticky top-24 h-fit">
                <Toc toc={scope.toc} />
            </div> */}

            <div className="flex-1">
                <Suspense fallback={<LoadingComponent />}>
                    <ArchitecturePage code={code} frontmatter={frontmatter} />
                </Suspense>
            </div>
        </div>
    )
}
