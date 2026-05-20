import { Module } from '@nestjs/common';
import { EpssCollector } from './collectors/epss/epss.collector';
import { KevCollector } from './collectors/kev/kev.collector';
import { NvdCollector } from './collectors/nvd/nvd.collector';
import { IngestSchedulerService } from './ingest-scheduler.service';
import { IngestController } from './ingest.controller';
import { IngestService } from './ingest.service';

@Module({
  controllers: [IngestController],
  providers: [
    IngestService,
    IngestSchedulerService,
    NvdCollector,
    KevCollector,
    EpssCollector,
  ],
})
export class IngestModule {}
