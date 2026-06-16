import {
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IngestService } from './ingest.service';
import { BackendAuthGuard } from '../../shared/guards/backend-auth.guard';

@Controller('ingest')
@UseGuards(BackendAuthGuard)
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  @Get('sources')
  getSources() {
    return {
      mode: 'pull',
      note: 'These upstream feeds are polling APIs, not push streams.',
      sources: this.ingestService.getSources(),
    };
  }

  @Get('status')
  getStatus() {
    return this.ingestService.getStatus();
  }

  @Post('sync')
  syncRecent(
    @Query('lookbackHours', new ParseIntPipe({ optional: true }))
    lookbackHours?: number,
  ) {
    return this.ingestService.syncRecent(lookbackHours);
  }
}
