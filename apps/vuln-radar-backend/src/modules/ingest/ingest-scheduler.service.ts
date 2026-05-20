import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { AppConfigService } from '../../config/app-config.service';
import { IngestService } from './ingest.service';

@Injectable()
export class IngestSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IngestSchedulerService.name);
  private readonly intervalName = 'ingest-sync-interval';
  private intervalRef?: ReturnType<typeof setInterval>;
  private syncInFlight = false;

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly ingestService: IngestService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    if (!this.appConfigService.ingestSchedulerEnabled) {
      this.logger.log(
        'Automatic ingest scheduler is disabled. Manual POST /api/ingest/sync remains available.',
      );
      return;
    }

    const intervalMs =
      this.appConfigService.ingestSyncIntervalMinutes * 60 * 1000;

    this.intervalRef = setInterval(() => {
      void this.runScheduledSync('interval');
    }, intervalMs);
    this.schedulerRegistry.addInterval(this.intervalName, this.intervalRef);

    this.logger.log(
      `Automatic ingest scheduler enabled. Sync runs every ${this.appConfigService.ingestSyncIntervalMinutes} minutes.`,
    );

    if (this.appConfigService.ingestSyncOnStartup) {
      void this.runScheduledSync('startup');
    }
  }

  onModuleDestroy() {
    if (!this.intervalRef) {
      return;
    }

    clearInterval(this.intervalRef);

    if (this.schedulerRegistry.doesExist('interval', this.intervalName)) {
      this.schedulerRegistry.deleteInterval(this.intervalName);
    }
  }

  private async runScheduledSync(trigger: 'startup' | 'interval') {
    if (this.syncInFlight) {
      this.logger.warn(
        `Skipping scheduled ingest sync from ${trigger} because another sync is already running.`,
      );
      return;
    }

    this.syncInFlight = true;

    try {
      const result = await this.ingestService.syncRecent();

      this.logger.log(
        `Scheduled ingest sync (${trigger}) completed: ${result.counts.processedVulnerabilities} vulnerabilities processed, ${result.counts.watchMatches} watch matches.`,
      );
    } catch (error) {
      this.logger.error(
        `Scheduled ingest sync (${trigger}) failed: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    } finally {
      this.syncInFlight = false;
    }
  }
}
