import { Module } from '@nestjs/common';
import { FeedsController } from './feeds.controller';
import { FeedsRepository } from './feeds.repository';
import { FeedsService } from './feeds.service';

@Module({
  controllers: [FeedsController],
  providers: [FeedsService, FeedsRepository],
})
export class FeedsModule {}
