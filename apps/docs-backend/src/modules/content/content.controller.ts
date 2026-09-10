import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { canonicalPostsPayloadSchema } from '@web-tech/docs-content-contract';

import { ContentTokenGuard } from '../../common/guards/content-token.guard';
import { isValidMarkdownPath, normalizeMarkdownPath } from './content-path';
import { ContentService } from './content.service';

@Controller()
@UseGuards(ContentTokenGuard)
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('api/posts')
  @Header('Cache-Control', 'private, no-store')
  @Header('Vary', 'Authorization')
  async getPosts() {
    return canonicalPostsPayloadSchema.parse({
      results: await this.contentService.getPublishedPosts(),
    });
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
    return this.contentService.renderPost(document);
  }
}
