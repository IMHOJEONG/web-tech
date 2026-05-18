import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module';
import { PrismaModule } from './infra/prisma/prisma.module';
import { FeedsModule } from './modules/feeds/feeds.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [AppConfigModule, PrismaModule, HealthModule, FeedsModule],
})
export class AppModule {}
