import { Module } from '@nestjs/common';

import { ContentTokenGuard } from '../../common/guards/content-token.guard';
import { ContentController } from './content.controller';
import { ContentRepository } from './content.repository';
import { ContentService } from './content.service';
import { MarkdownRendererService } from './markdown-renderer.service';

@Module({
  controllers: [ContentController],
  providers: [
    ContentRepository,
    ContentService,
    ContentTokenGuard,
    MarkdownRendererService,
  ],
})
export class ContentModule {}
