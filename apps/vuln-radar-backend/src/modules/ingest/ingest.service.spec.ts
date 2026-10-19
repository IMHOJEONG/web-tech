import { BadRequestException } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { EpssCollector } from './collectors/epss/epss.collector';
import { KevCollector } from './collectors/kev/kev.collector';
import { NvdCollector } from './collectors/nvd/nvd.collector';
import { IngestService } from './ingest.service';

describe('IngestService', () => {
  const createAppConfigService = (
    overrides?: Partial<{
      ingestLookbackHours: number;
      ingestMaxLookbackHours: number;
      ingestSourceTimeoutMs: number;
    }>,
  ) =>
    ({
      ingestLookbackHours: overrides?.ingestLookbackHours ?? 24,
      ingestMaxLookbackHours: overrides?.ingestMaxLookbackHours ?? 240,
      ingestSourceTimeoutMs: overrides?.ingestSourceTimeoutMs ?? 60_000,
    }) as AppConfigService;

  const createClient = () => ({
    advisory: {
      upsert: jest.fn(),
    },
    epssScore: {
      upsert: jest.fn(),
    },
    vulnerability: {
      upsert: jest.fn(),
    },
    watchlistEntry: {
      findMany: jest.fn(async () => []),
    },
    watchMatch: {
      deleteMany: jest.fn(),
      upsert: jest.fn(),
    },
  });

  const createSourceDefinition = (id: string) => ({
    id,
    name: id,
    kind: 'polling' as const,
    endpoint: `https://example.com/${id}`,
    note: `${id} source`,
  });

  it('keeps processing database writes when EPSS times out', async () => {
    const client = createClient();
    const service = new IngestService(
      createAppConfigService(),
      {
        getClient: jest.fn(async () => client),
      } as unknown as PrismaService,
      {
        fetchRecent: jest.fn(async () => [
          {
            cveId: 'CVE-2026-0001',
            title: 'Test vulnerability',
            description: 'A vulnerability that still needs EPSS.',
            severity: 'high',
            cvssScore: 8.8,
            publishedAt: new Date('2026-09-01T00:00:00.000Z'),
            lastModifiedAt: new Date('2026-09-01T00:00:00.000Z'),
            rawSourceJson: {
              source: 'nvd',
            },
          },
        ]),
        getSourceDefinition: jest.fn(() => createSourceDefinition('nvd')),
      } as unknown as NvdCollector,
      {
        fetchCatalog: jest.fn(async () => []),
        getSourceDefinition: jest.fn(() => createSourceDefinition('kev')),
      } as unknown as KevCollector,
      {
        fetchScores: jest.fn(async () => {
          throw new Error('The operation was aborted due to timeout');
        }),
        getSourceDefinition: jest.fn(() => createSourceDefinition('epss')),
      } as unknown as EpssCollector,
    );

    const response = await service.syncRecent(24);

    expect(response.status).toBe('partial');
    expect(response.failures).toEqual([
      {
        sourceId: 'epss',
        stage: 'fetch_scores',
        message: 'The operation was aborted due to timeout',
        fatal: false,
      },
    ]);
    expect(response.counts.processedVulnerabilities).toBe(1);
    expect(client.vulnerability.upsert).toHaveBeenCalledTimes(1);
    expect(
      client.vulnerability.upsert.mock.calls[0]?.[0].update,
    ).not.toHaveProperty('epssScore');
    expect(
      client.vulnerability.upsert.mock.calls[0]?.[0].update,
    ).not.toHaveProperty('riskScore');
  });

  it('rejects backfills larger than the configured maximum lookback window', async () => {
    const service = new IngestService(
      createAppConfigService({
        ingestMaxLookbackHours: 72,
      }),
      {
        getClient: jest.fn(async () => createClient()),
      } as unknown as PrismaService,
      {
        fetchRecent: jest.fn(),
        getSourceDefinition: jest.fn(() => createSourceDefinition('nvd')),
      } as unknown as NvdCollector,
      {
        fetchCatalog: jest.fn(),
        getSourceDefinition: jest.fn(() => createSourceDefinition('kev')),
      } as unknown as KevCollector,
      {
        fetchScores: jest.fn(),
        getSourceDefinition: jest.fn(() => createSourceDefinition('epss')),
      } as unknown as EpssCollector,
    );

    await expect(service.syncRecent(240)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
