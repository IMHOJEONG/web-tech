import { z } from 'zod'

const LEAF_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MARKDOWN_PATH_PATTERN =
    /^(feed|web|mobile|ui-ux)\/[a-z0-9]+(?:-[a-z0-9]+)*$/

export const remoteSlugSchema = z.string().trim().regex(LEAF_SLUG_PATTERN)

export const remoteMarkdownPathSchema = z
    .string()
    .trim()
    .regex(MARKDOWN_PATH_PATTERN)

export const remoteRouteContractSchema = z.object({
    slug: remoteSlugSchema,
    title: z.string().trim().min(1),
    markdownPath: remoteMarkdownPathSchema.nullish(),
})

export function validateRemoteRouteContract(input: {
    slug: string
    title: string
    markdownPath?: string | null
}) {
    return remoteRouteContractSchema.safeParse(input)
}
