import { SchedulerRegistry } from '@nestjs/schedule';
import { AppConfigService } from '../../config/app-config.service';
import { IngestSchedulerService } from './ingest-scheduler.service';
import { IngestService } from './ingest.service';

describe('IngestSchedulerService', () => {
  const createAppConfigService = (
    overrides?: Partial<{
      ingestSchedulerEnabled: boolean;
      ingestSyncIntervalMinutes: number;
      ingestSyncOnStartup: boolean;
    }>,
  ) =>
    ({
      ingestSchedulerEnabled: overrides?.ingestSchedulerEnabled ?? true,
      ingestSyncIntervalMinutes: overrides?.ingestSyncIntervalMinutes ?? 60,
      ingestSyncOnStartup: overrides?.ingestSyncOnStartup ?? false,
    }) as AppConfigService;

  const createIngestService = () =>
    ({
      syncRecent: jest.fn(async () => ({
        startedAt: '2026-05-20T00:00:00.000Z',
        completedAt: '2026-05-20T00:00:10.000Z',
        lookbackHours: 24,
        sources: [],
        counts: {
          nvdVulnerabilities: 10,
          kevEntries: 5,
          epssScores: 10,
          watchMatches: 3,
          processedVulnerabilities: 12,
        },
      })),
    }) as unknown as IngestService;

  const createSchedulerRegistry = () =>
    ({
      addInterval: jest.fn(),
      deleteInterval: jest.fn(),
      doesExist: jest.fn(() => true),
    }) as unknown as SchedulerRegistry;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('registers a repeating interval when enabled', () => {
    const appConfigService = createAppConfigService({
      ingestSchedulerEnabled: true,
      ingestSyncIntervalMinutes: 15,
    });
    const ingestService = createIngestService();
    const schedulerRegistry = createSchedulerRegistry();
    const setIntervalSpy = jest
      .spyOn(global, 'setInterval')
      .mockReturnValue({} as ReturnType<typeof setInterval>);

    const scheduler = new IngestSchedulerService(
      appConfigService,
      ingestService,
      schedulerRegistry,
    );

    scheduler.onModuleInit();

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 900_000);
    expect(schedulerRegistry.addInterval).toHaveBeenCalledWith(
      'ingest-sync-interval',
      expect.anything(),
    );
  });

  it('does not register an interval when disabled', () => {
    const appConfigService = createAppConfigService({
      ingestSchedulerEnabled: false,
    });
    const ingestService = createIngestService();
    const schedulerRegistry = createSchedulerRegistry();
    const setIntervalSpy = jest.spyOn(global, 'setInterval');

    const scheduler = new IngestSchedulerService(
      appConfigService,
      ingestService,
      schedulerRegistry,
    );

    scheduler.onModuleInit();

    expect(setIntervalSpy).not.toHaveBeenCalled();
    expect(schedulerRegistry.addInterval).not.toHaveBeenCalled();
  });

  it('triggers an immediate sync when startup sync is enabled', async () => {
    const appConfigService = createAppConfigService({
      ingestSyncOnStartup: true,
    });
    const ingestService = createIngestService();
    const schedulerRegistry = createSchedulerRegistry();
    jest
      .spyOn(global, 'setInterval')
      .mockReturnValue({} as ReturnType<typeof setInterval>);

    const scheduler = new IngestSchedulerService(
      appConfigService,
      ingestService,
      schedulerRegistry,
    );

    scheduler.onModuleInit();
    await Promise.resolve();

    expect(ingestService.syncRecent).toHaveBeenCalledTimes(1);
  });
});
