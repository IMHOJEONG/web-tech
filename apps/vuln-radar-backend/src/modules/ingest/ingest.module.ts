import { Module } from '@nestjs/common';
import { EpssCollector } from './collectors/epss/epss.collector';
import { KevCollector } from './collectors/kev/kev.collector';
import { NvdCollector } from './collectors/nvd/nvd.collector';
import { IngestSchedulerService } from './ingest-scheduler.service';
import { IngestController } from './ingest.controller';
import { IngestService } from './ingest.service';
import { BackendAuthGuard } from '../../shared/guards/backend-auth.guard';

@Module({
  controllers: [IngestController],
  providers: [
    BackendAuthGuard,
    IngestService,
    IngestSchedulerService,
    NvdCollector,
    KevCollector,
    EpssCollector,
  ],
})
export class IngestModule {}
