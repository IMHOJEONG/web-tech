import { Test, TestingModule } from '@nestjs/testing';
import { AppConfigService } from '../../config/app-config.service';
import { BackendAuthGuard } from '../../shared/guards/backend-auth.guard';
import { IngestController } from './ingest.controller';
import { IngestService } from './ingest.service';

describe('IngestController', () => {
  let ingestController: IngestController;

  const ingestService = {
    getSources: jest.fn(() => [
      {
        id: 'nvd',
        name: 'NVD CVE API 2.0',
        kind: 'polling' as const,
        endpoint: 'https://services.nvd.nist.gov/rest/json/cves/2.0',
        note: 'Recent updates are pulled by last modified window.',
      },
    ]),
    getStatus: jest.fn(async () => ({
      checkedAt: '2026-05-18T15:00:00.000Z',
      mode: 'pull' as const,
      storage: 'database' as const,
      note: 'Upstream sources are pull-based.',
      scheduler: {
        enabled: true,
        intervalMinutes: 60,
        syncOnStartup: false,
      },
      sources: [],
      latest: {
        databaseUpdatedAt: '2026-05-18T15:00:00.000Z',
        upstreamLastModifiedAt: '2026-05-18T14:00:00.000Z',
        kevCatalogAddedAt: '2026-05-18T13:00:00.000Z',
        epssObservedAt: '2026-05-18T12:00:00.000Z',
      },
      counts: {
        vulnerabilities: 10,
        p0: 3,
        p1: 2,
        kevAdvisories: 4,
        enabledWatchlistEntries: 2,
      },
    })),
    syncRecent: jest.fn(async () => ({
      startedAt: '2026-05-18T15:00:00.000Z',
      completedAt: '2026-05-18T15:00:10.000Z',
      lookbackHours: 6,
      sources: [],
      counts: {
        nvdVulnerabilities: 10,
        kevEntries: 5,
        epssScores: 10,
        watchMatches: 2,
        processedVulnerabilities: 12,
      },
    })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [IngestController],
      providers: [
        {
          provide: IngestService,
          useValue: ingestService,
        },
        {
          provide: BackendAuthGuard,
          useValue: {
            canActivate: () => true,
          },
        },
        {
          provide: AppConfigService,
          useValue: {
            backendApiToken: 'test-token',
          },
        },
      ],
    }).compile();

    ingestController = app.get<IngestController>(IngestController);
  });

  it('returns source metadata', () => {
    const response = ingestController.getSources();

    expect(response.mode).toBe('pull');
    expect(response.sources[0]?.id).toBe('nvd');
  });

  it('returns current ingest status', async () => {
    const response = await ingestController.getStatus();

    expect(response.storage).toBe('database');
    expect(response.counts.vulnerabilities).toBe(10);
  });

  it('forwards sync requests', async () => {
    const response = await ingestController.syncRecent(6);

    expect(ingestService.syncRecent).toHaveBeenCalledWith(6);
    expect(response.lookbackHours).toBe(6);
  });
});
