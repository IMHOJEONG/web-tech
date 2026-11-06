import { z } from "zod";
import {
  canonicalPublishedPostSchema,
  CONTENT_HTML_MAX_BYTES,
  CONTENT_POSTS_MAX_BYTES,
  LEAF_SLUG_PATTERN,
  MARKDOWN_PATH_PATTERN,
} from "./index.ts";

export const PUBLICATION_POINTER_MAX_BYTES = 4 * 1024;
export const PUBLICATION_MANIFEST_MAX_BYTES = 1024 * 1024;
export const PUBLICATION_MAX_DOCUMENTS = 4096;
// Artifact payload total; pointer and manifest have separate bounded envelopes.
export const PUBLICATION_SNAPSHOT_MAX_BYTES = 64 * 1024 * 1024;

export const publicationRevisionSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const publicationGenerationSchema = z
  .string()
  .regex(
    /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/,
  );
export const publicationPathSchema = z
  .string()
  .max(256)
  .regex(MARKDOWN_PATH_PATTERN);

const artifact = (maxBytes: number) =>
  z
    .object({
      bytes: z.number().int().positive().max(maxBytes),
      sha256: publicationRevisionSchema,
    })
    .strict()
    .readonly();

export const publicationManifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    formatVersion: z.literal(1),
    index: artifact(CONTENT_POSTS_MAX_BYTES),
    documents: z
      .array(
        z
          .object({
            markdownPath: publicationPathSchema,
            bytes: z.number().int().positive().max(CONTENT_HTML_MAX_BYTES),
            sha256: publicationRevisionSchema,
          })
          .strict()
          .readonly(),
      )
      .max(PUBLICATION_MAX_DOCUMENTS)
      .readonly(),
  })
  .strict()
  .superRefine((manifest, ctx) => {
    let total = manifest.index.bytes;
    for (const [index, document] of manifest.documents.entries()) {
      const previous = manifest.documents[index - 1];
      if (previous && previous.markdownPath >= document.markdownPath) {
        ctx.addIssue({
          code: "custom",
          path: ["documents"],
          message: "paths must be unique and ASCII-sorted",
        });
        break;
      }
      total += document.bytes;
    }
    if (total > PUBLICATION_SNAPSHOT_MAX_BYTES)
      ctx.addIssue({
        code: "custom",
        path: ["documents"],
        message: "snapshot exceeds artifact budget",
      });
  })
  .readonly();

export const publicationPointerSchema = z
  .object({
    schemaVersion: z.literal(1),
    generation: publicationGenerationSchema,
    revision: publicationRevisionSchema,
    previousGeneration: publicationGenerationSchema.nullable(),
  })
  .strict()
  .refine((pointer) => pointer.generation !== pointer.previousGeneration, {
    message: "generation must change on publication",
  })
  .readonly();

const postSchema = canonicalPublishedPostSchema
  .extend({
    id: publicationPathSchema,
    markdownPath: publicationPathSchema,
    slug: z.string().regex(LEAF_SLUG_PATTERN),
  })
  .strict()
  .refine(
    (post) =>
      post.id === post.markdownPath &&
      post.slug === post.markdownPath.split("/")[1],
    { message: "post identity must match its canonical path" },
  );

export const publicationIndexSchema = z
  .object({
    results: z.array(postSchema).max(PUBLICATION_MAX_DOCUMENTS),
  })
  .strict()
  .refine(
    (index) =>
      new Set(index.results.map((post) => post.markdownPath)).size ===
      index.results.length,
    { message: "post paths must be unique" },
  );

export type PublicationRevision = z.infer<typeof publicationRevisionSchema>;
export type PublicationGeneration = z.infer<typeof publicationGenerationSchema>;
export type PublicationPointer = z.infer<typeof publicationPointerSchema>;
export type PublicationManifest = z.infer<typeof publicationManifestSchema>;
export type PublicationIndex = z.infer<typeof publicationIndexSchema>;
