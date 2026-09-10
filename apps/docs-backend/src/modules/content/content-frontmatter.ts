import {
  contentDateSchema,
  editorialStatusSchema,
  leafSlugSchema,
  publishedDocumentFrontmatterSchema,
} from '@web-tech/docs-content-contract';
import { z } from 'zod';

import type { DocumentFrontmatter } from './content.types';

const dateSchema = z
  .union([z.string(), z.date()])
  .transform((value) =>
    value instanceof Date ? value.toISOString().slice(0, 10) : value.trim(),
  )
  .pipe(contentDateSchema);

const frontmatterSchema = z
  .object({
    author: z.string().trim().min(1).optional(),
    authorName: z.string().trim().min(1).optional(),
    authorRole: z.string().trim().min(1).optional(),
    date: dateSchema.optional(),
    readMinutes: z.coerce.number().int().positive().optional(),
    readTime: z.coerce.number().int().positive().optional(),
    role: z.string().trim().min(1).optional(),
    slug: leafSlugSchema.optional(),
    status: editorialStatusSchema.default('draft'),
    summary: z.string().trim().min(1).optional(),
    tags: z.array(z.string().trim().min(1)).default([]),
    thumbnail: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1).optional(),
    topic: z.string().trim().min(1).optional(),
    topicLabel: z.string().trim().min(1).optional(),
    updatedAt: dateSchema.optional(),
  })
  .passthrough();

export function parseDocumentFrontmatter(value: unknown): DocumentFrontmatter {
  const parsed = frontmatterSchema.parse(value);
  const normalized = {
    authorName: parsed.authorName ?? parsed.author,
    authorRole: parsed.authorRole ?? parsed.role,
    date: parsed.date,
    readMinutes: parsed.readMinutes ?? parsed.readTime,
    slug: parsed.slug,
    status: parsed.status,
    summary: parsed.summary,
    tags: parsed.tags,
    thumbnail: parsed.thumbnail,
    title: parsed.title,
    topicLabel: parsed.topicLabel ?? parsed.topic,
    updatedAt: parsed.updatedAt,
  };
  const status = normalized.status;

  if (status === 'published') {
    return publishedDocumentFrontmatterSchema.parse(normalized);
  }

  return {
    ...normalized,
    status,
  };
}
