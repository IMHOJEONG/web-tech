import type {
  CanonicalPublishedPost,
  EditorialStatus,
  PublishedDocumentFrontmatter,
} from '@web-tech/docs-content-contract';

export type ContentStatus = EditorialStatus;

type UnpublishedDocumentFrontmatter = {
  authorName?: string;
  authorRole?: string;
  date?: string;
  readMinutes?: number;
  slug?: string;
  status: Exclude<ContentStatus, 'published'>;
  summary?: string;
  tags: string[];
  thumbnail?: string;
  title?: string;
  topicLabel?: string;
  updatedAt?: string;
};

export type DocumentFrontmatter =
  | PublishedDocumentFrontmatter
  | UnpublishedDocumentFrontmatter;

export type ContentFile = {
  markdownPath: string;
  rawText: string;
};

export type PostMetadata = CanonicalPublishedPost;

export type PublishedDocument = {
  body: string;
  metadata: PostMetadata;
};
