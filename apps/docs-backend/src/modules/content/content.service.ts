import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import matter from 'gray-matter';
import { parse as parseYaml } from 'yaml';

import { ContentConfigService } from '../../config/content-config.service';
import { resolveAssetUrl } from './content-assets';
import { parseDocumentFrontmatter } from './content-frontmatter';
import { getLeafSlug } from './content-path';
import { ContentRepository } from './content.repository';
import type {
  ContentFile,
  PostMetadata,
  PublishedDocument,
} from './content.types';
import { MarkdownRendererService } from './markdown-renderer.service';

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    private readonly config: ContentConfigService,
    private readonly repository: ContentRepository,
    private readonly renderer: MarkdownRendererService,
  ) {}

  async getPublishedPosts(): Promise<PostMetadata[]> {
    const files = await this.repository.findAll();
    const posts = files.flatMap((file) => {
      try {
        const document = this.parsePublishedDocument(file);
        return document ? [document.metadata] : [];
      } catch (error) {
        this.logger.warn(
          `Skipping invalid content document: ${file.markdownPath} (${getErrorMessage(error)})`,
        );
        return [];
      }
    });

    return posts.sort(
      (left, right) =>
        right.date.localeCompare(left.date) || left.id.localeCompare(right.id),
    );
  }

  async getPublishedPost(markdownPath: string): Promise<PublishedDocument> {
    const file = await this.repository.findOne(markdownPath);

    if (!file) {
      throw new NotFoundException('Post not found');
    }

    try {
      const document = this.parsePublishedDocument(file);

      if (document) {
        return document;
      }
    } catch (error) {
      this.logger.warn(
        `Rejected invalid content document: ${markdownPath} (${getErrorMessage(error)})`,
      );
    }

    throw new NotFoundException('Post not found');
  }

  renderPost(document: PublishedDocument): string {
    const content = this.renderer.render(
      document.body,
      document.metadata.markdownPath,
    );

    return `<!doctype html><html><body><article>${content}</article></body></html>`;
  }

  private parsePublishedDocument(file: ContentFile): PublishedDocument | null {
    const parsedMarkdown = matter(file.rawText, {
      engines: {
        yaml: (source) => parseYaml(source) as Record<string, unknown>,
      },
    });
    const frontmatter = parseDocumentFrontmatter(parsedMarkdown.data);

    if (frontmatter.status !== 'published') {
      return null;
    }

    const fileSlug = getLeafSlug(file.markdownPath);

    if (frontmatter.slug !== fileSlug) {
      throw new Error('frontmatter slug must match the Markdown file name');
    }

    return {
      body: parsedMarkdown.content.trim(),
      metadata: {
        authorName: frontmatter.authorName,
        authorRole: frontmatter.authorRole,
        date: frontmatter.date,
        id: file.markdownPath,
        markdownPath: file.markdownPath,
        readMinutes: frontmatter.readMinutes,
        slug: frontmatter.slug,
        status: 'published',
        summary: frontmatter.summary,
        tags: frontmatter.tags,
        thumbnail: frontmatter.thumbnail
          ? resolveAssetUrl(
              frontmatter.thumbnail,
              this.config.assetBaseUrl,
              file.markdownPath,
            )
          : undefined,
        title: frontmatter.title,
        topicLabel: frontmatter.topicLabel,
        updatedAt: frontmatter.updatedAt,
      },
    };
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown error';
}
