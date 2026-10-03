import { Module } from '@nestjs/common';
import { PushConfig } from './push.config';
import { PushController } from './push.controller';
import { PushGuard } from './push.guard';
import { PushRepository } from './push.repository';
import { PushService } from './push.service';

@Module({
  controllers: [PushController],
  providers: [PushConfig, PushGuard, PushRepository, PushService],
})
export class PushModule {}
