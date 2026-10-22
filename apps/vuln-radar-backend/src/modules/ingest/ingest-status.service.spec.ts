import { ConflictException } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { EpssCollector } from './collectors/epss/epss.collector';
import { KevCollector } from './collectors/kev/kev.collector';
import { NvdCollector } from './collectors/nvd/nvd.collector';
import { IngestService } from './ingest.service';

const vulnerability = {
  cveId: 'CVE-2099-2001',
  title: 'Synthetic collection fixture',
  description: 'Local test only',
  severity: 'high',
  cvssScore: 8,
  publishedAt: new Date('2026-01-01Z'),
  lastModifiedAt: new Date('2026-01-01Z'),
  rawSourceJson: {},
};

function harness() {
  const source = (id: string) => ({
    id,
    name: id,
    kind: 'polling',
    endpoint: `https://example.com/${id}`,
    note: 'Synthetic',
  });
  const client = {
    vulnerability: {
      findMany: jest.fn(async () => []),
      upsert: jest.fn(async () => ({})),
    },
    advisory: { findMany: jest.fn(async () => []), upsert: jest.fn() },
    epssScore: { findMany: jest.fn(async () => []), upsert: jest.fn() },
    watchlistEntry: { findMany: jest.fn(async () => []) },
    watchMatch: { deleteMany: jest.fn(), upsert: jest.fn() },
  };
  const nvd = {
    getSourceDefinition: () => source('nvd'),
    fetchRecent: jest.fn(async () => [vulnerability]),
  };
  const kev = {
    getSourceDefinition: () => source('kev'),
    fetchCatalog: jest.fn(async () => []),
  };
  const epss = {
    getSourceDefinition: () => source('epss'),
    fetchScores: jest.fn(async () => []),
  };
  const service = new IngestService(
    {
      ingestLookbackHours: 24,
      ingestMaxLookbackHours: 240,
      ingestSchedulerEnabled: true,
      ingestSyncIntervalMinutes: 1440,
      ingestSourceTimeoutMs: 60_000,
      ingestSyncOnStartup: false,
    } as AppConfigService,
    { getClient: jest.fn(async () => client) } as unknown as PrismaService,
    nvd as unknown as NvdCollector,
    kev as unknown as KevCollector,
    epss as unknown as EpssCollector,
  );
  return { service, client, nvd, kev, epss };
}

describe('IngestService observed status', () => {
  it('does not substitute a status read for a successful collection', async () => {
    const { service } = harness();
    const status = await service.getStatus();
    expect(status.checkedAt).toBeTruthy();
    expect(status.observation).toMatchObject({
      scope: 'process',
      outcome: 'unknown',
      lastSuccessAt: null,
    });
    expect(status.scheduler.intervalMinutes).toBe(1440);
  });

  it('records full success only after source fetches and writes finish', async () => {
    const { service, client } = harness();
    await service.syncRecent();
    const status = await service.getStatus();
    expect(client.vulnerability.upsert).toHaveBeenCalledTimes(1);
    expect(status.observation.outcome).toBe('completed');
    expect(status.observation.lastSuccessAt).toBeTruthy();
    expect(status.observation.sources.map((source) => source.outcome)).toEqual([
      'succeeded',
      'succeeded',
      'succeeded',
    ]);
  });

  it('records partial failure without inventing a full success or exposing error details', async () => {
    const { service, epss, client } = harness();
    epss.fetchScores.mockRejectedValueOnce(
      new Error('private upstream details'),
    );
    await service.syncRecent();
    const status = await service.getStatus();
    expect(client.vulnerability.upsert).toHaveBeenCalledTimes(1);
    expect(status.observation.outcome).toBe('partial');
    expect(status.observation.lastSuccessAt).toBeNull();
    expect(status.observation.sources[2]).toMatchObject({
      outcome: 'failed',
      consecutiveFailures: 1,
      lastFetchSuccessAt: null,
    });
    expect(JSON.stringify(status.observation)).not.toContain(
      'private upstream details',
    );
  });

  it('records primary-source failure without claiming EPSS was fetched', async () => {
    const { service, nvd, kev, epss } = harness();
    nvd.fetchRecent.mockRejectedValueOnce(new Error('NVD unavailable'));
    kev.fetchCatalog.mockRejectedValueOnce(new Error('KEV unavailable'));
    await expect(service.syncRecent()).rejects.toThrow('primary source');
    const status = await service.getStatus();
    expect(status.observation.outcome).toBe('failed');
    expect(status.observation.sources.map((source) => source.outcome)).toEqual([
      'failed',
      'failed',
      'not_attempted',
    ]);
    expect(epss.fetchScores).not.toHaveBeenCalled();
  });

  it('preserves the last complete success after a database write failure', async () => {
    const { service, client } = harness();
    await service.syncRecent();
    const success = (await service.getStatus()).observation.lastSuccessAt;
    client.vulnerability.upsert.mockRejectedValueOnce(
      new Error('Synthetic write failure'),
    );
    await expect(service.syncRecent()).rejects.toThrow(
      'Synthetic write failure',
    );
    const status = await service.getStatus();
    expect(status.observation).toMatchObject({
      outcome: 'failed',
      lastSuccessAt: success,
    });
    expect(
      status.observation.sources.every(
        (source) => source.outcome === 'succeeded',
      ),
    ).toBe(true);
  });

  it('guards manual and scheduled overlaps in the same process and releases after completion', async () => {
    const { service, nvd } = harness();
    let release!: (value: (typeof vulnerability)[]) => void;
    nvd.fetchRecent.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const first = service.syncRecent();
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect((await service.getStatus()).observation.outcome).toBe('running');
    await expect(service.syncRecent()).rejects.toBeInstanceOf(
      ConflictException,
    );
    release([vulnerability]);
    await first;
    await expect(service.syncRecent()).resolves.toMatchObject({
      status: 'completed',
    });
  });

  it('skips EPSS for an empty primary result instead of creating fetch-success metadata', async () => {
    const { service, nvd, epss } = harness();
    nvd.fetchRecent.mockResolvedValueOnce([]);
    await service.syncRecent();
    expect(epss.fetchScores).not.toHaveBeenCalled();
    expect((await service.getStatus()).observation.sources[2]).toMatchObject({
      outcome: 'skipped',
      lastFetchSuccessAt: null,
    });
  });
});
