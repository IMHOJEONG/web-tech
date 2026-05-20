import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppConfigModule } from './config/app-config.module';
import { PrismaModule } from './infra/prisma/prisma.module';
import { FeedsModule } from './modules/feeds/feeds.module';
import { HealthModule } from './modules/health/health.module';
import { IngestModule } from './modules/ingest/ingest.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AppConfigModule,
    PrismaModule,
    HealthModule,
    FeedsModule,
    IngestModule,
  ],
})
export class AppModule {}
