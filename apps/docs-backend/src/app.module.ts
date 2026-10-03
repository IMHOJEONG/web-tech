import { Module } from '@nestjs/common';

import { ContentConfigModule } from './config/content-config.module';
import { ContentModule } from './modules/content/content.module';
import { HealthModule } from './modules/health/health.module';
import { PushModule } from './modules/push/push.module';

@Module({
  imports: [ContentConfigModule, HealthModule, ContentModule, PushModule],
})
export class AppModule {}
