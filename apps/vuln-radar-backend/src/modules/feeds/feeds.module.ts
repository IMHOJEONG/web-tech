import { Module } from '@nestjs/common';
import { FeedsController } from './feeds.controller';
import { FeedsRepository } from './feeds.repository';
import { FeedsService } from './feeds.service';
import { BackendAuthGuard } from '../../shared/guards/backend-auth.guard';

@Module({
  controllers: [FeedsController],
  providers: [FeedsService, FeedsRepository, BackendAuthGuard],
})
export class FeedsModule {}
