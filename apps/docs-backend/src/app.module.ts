import { Module } from '@nestjs/common';

import { ContentConfigModule } from './config/content-config.module';
import { ContentModule } from './modules/content/content.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [ContentConfigModule, HealthModule, ContentModule],
})
export class AppModule {}
