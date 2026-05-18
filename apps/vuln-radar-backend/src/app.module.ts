import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module';
import { FeedsModule } from './modules/feeds/feeds.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [AppConfigModule, HealthModule, FeedsModule],
})
export class AppModule {}
