import {
  Controller,
  Get,
  Header,
  Logger,
  NotFoundException,
  Param,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import {
  canonicalPostsPayloadSchema,
  CONTENT_HTML_MAX_BYTES,
  CONTENT_HTML_WARN_BYTES,
  CONTENT_POSTS_MAX_BYTES,
  CONTENT_POSTS_WARN_BYTES,
} from '@web-tech/docs-content-contract';

import { ContentTokenGuard } from '../../common/guards/content-token.guard';
import { isValidMarkdownPath, normalizeMarkdownPath } from './content-path';
import { ContentService } from './content.service';

@Controller()
@UseGuards(ContentTokenGuard)
export class ContentController {
  private readonly logger = new Logger(ContentController.name);

  constructor(private readonly contentService: ContentService) {}

  @Get('api/posts')
  @Header('Cache-Control', 'private, no-store')
  @Header('Vary', 'Authorization')
  async getPosts() {
    const payload = canonicalPostsPayloadSchema.parse({
      results: await this.contentService.getPublishedPosts(),
    });
    const bytes = Buffer.byteLength(JSON.stringify(payload), 'utf8');
    if (bytes > CONTENT_POSTS_MAX_BYTES) {
      this.logger.error({
        event: 'content.posts_budget_exceeded',
        bytes,
        limitBytes: CONTENT_POSTS_MAX_BYTES,
        count: payload.results.length,
      });
      throw new ServiceUnavailableException(
        'Content index exceeds size budget',
      );
    }
    if (bytes > CONTENT_POSTS_WARN_BYTES) {
      this.logger.warn({
        event: 'content.posts_budget_warning',
        bytes,
        limitBytes: CONTENT_POSTS_MAX_BYTES,
        count: payload.results.length,
      });
    }
    return payload;
  }

  @Get('posts/:channel/:slug')
  @Header('Cache-Control', 'private, no-store')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Vary', 'Authorization')
  async getPost(
    @Param('channel') channel: string,
    @Param('slug') slug: string,
  ): Promise<string> {
    const markdownPath = normalizeMarkdownPath([channel, slug]);

    if (!isValidMarkdownPath(markdownPath)) {
      throw new NotFoundException('Post not found');
    }

    const document = await this.contentService.getPublishedPost(markdownPath);
    const html = this.contentService.renderPost(document);
    const bytes = Buffer.byteLength(html, 'utf8');
    if (bytes > CONTENT_HTML_MAX_BYTES) {
      this.logger.error({
        event: 'content.html_budget_exceeded',
        bytes,
        limitBytes: CONTENT_HTML_MAX_BYTES,
      });
      throw new ServiceUnavailableException('Content HTML exceeds size budget');
    }
    if (bytes > CONTENT_HTML_WARN_BYTES) {
      this.logger.warn({
        event: 'content.html_budget_warning',
        bytes,
        limitBytes: CONTENT_HTML_MAX_BYTES,
      });
    }
    return html;
  }
}
