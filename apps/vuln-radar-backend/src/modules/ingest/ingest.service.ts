import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { calculateRiskScore } from '../../shared/lib/risk-score';
import type { RadarPriority } from '../../shared/types/radar';
import { EpssCollector } from './collectors/epss/epss.collector';
import { KevCollector } from './collectors/kev/kev.collector';
import { NvdCollector } from './collectors/nvd/nvd.collector';
import {
  ExternalApiSource,
  IngestStatusResponse,
  IngestSyncResponse,
  ProcessedVulnerabilitySnapshot,
} from './ingest.types';

type DbWatchlistEntry = {
  id: string;
  type: 'vendor' | 'product' | 'ecosystem' | 'keyword';
  value: string;
  enabled: boolean;
};

type DbIngestStatusVulnerability = {
  priority: RadarPriority;
  lastModifiedAt: Date;
  updatedAt: Date;
};

type DbIngestStatusAdvisory = {
  publishedAt: Date | null;
};

type DbIngestStatusEpssScore = {
  observedAt: Date;
};

@Injectable()
export class IngestService {
  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly prismaService: PrismaService,
    private readonly nvdCollector: NvdCollector,
    private readonly kevCollector: KevCollector,
    private readonly epssCollector: EpssCollector,
  ) {}

  getSources(): ExternalApiSource[] {
    return [
      this.nvdCollector.getSourceDefinition(),
      this.kevCollector.getSourceDefinition(),
      this.epssCollector.getSourceDefinition(),
    ];
  }

  async getStatus(): Promise<IngestStatusResponse> {
    const checkedAt = new Date().toISOString();
    const client = await this.prismaService.getClient();

    if (!client) {
      return {
        checkedAt,
        mode: 'pull',
        storage: 'unavailable',
        note: 'Database client is not ready, so live ingest freshness cannot be derived yet.',
        sources: this.getSources(),
        latest: {
          databaseUpdatedAt: null,
          upstreamLastModifiedAt: null,
          kevCatalogAddedAt: null,
          epssObservedAt: null,
        },
        counts: {
          vulnerabilities: 0,
          p0: 0,
          p1: 0,
          kevAdvisories: 0,
          enabledWatchlistEntries: 0,
        },
      };
    }

    const [vulnerabilities, kevAdvisories, epssScores, watchlistEntries] =
      await Promise.all([
        client.vulnerability.findMany({
          select: {
            priority: true,
            lastModifiedAt: true,
            updatedAt: true,
          },
        }),
        client.advisory.findMany({
          where: {
            source: 'cisa-kev',
          },
          select: {
            publishedAt: true,
          },
        }),
        client.epssScore.findMany({
          select: {
            observedAt: true,
          },
        }),
        client.watchlistEntry.findMany({
          where: {
            enabled: true,
          },
          select: {
            id: true,
            type: true,
            value: true,
            enabled: true,
          },
        }),
      ]);

    const typedVulnerabilities =
      vulnerabilities as DbIngestStatusVulnerability[];
    const typedKevAdvisories = kevAdvisories as DbIngestStatusAdvisory[];
    const typedEpssScores = epssScores as DbIngestStatusEpssScore[];
    const typedWatchlistEntries = watchlistEntries as DbWatchlistEntry[];

    const latestDatabaseUpdatedAt = typedVulnerabilities.reduce<Date | null>(
      (latest, vulnerability) =>
        !latest || vulnerability.updatedAt > latest
          ? vulnerability.updatedAt
          : latest,
      null,
    );
    const latestUpstreamModifiedAt = typedVulnerabilities.reduce<Date | null>(
      (latest, vulnerability) =>
        !latest || vulnerability.lastModifiedAt > latest
          ? vulnerability.lastModifiedAt
          : latest,
      null,
    );
    const latestKevPublishedAt = typedKevAdvisories.reduce<Date | null>(
      (latest, advisory) =>
        advisory.publishedAt && (!latest || advisory.publishedAt > latest)
          ? advisory.publishedAt
          : latest,
      null,
    );
    const latestEpssObservedAt = typedEpssScores.reduce<Date | null>(
      (latest, score) =>
        !latest || score.observedAt > latest ? score.observedAt : latest,
      null,
    );

    return {
      checkedAt,
      mode: 'pull',
      storage: 'database',
      note: 'Upstream sources are polled on demand right now, so freshness is near-real-time rather than push-real-time.',
      sources: this.getSources(),
      latest: {
        databaseUpdatedAt: latestDatabaseUpdatedAt?.toISOString() ?? null,
        upstreamLastModifiedAt: latestUpstreamModifiedAt?.toISOString() ?? null,
        kevCatalogAddedAt: latestKevPublishedAt?.toISOString() ?? null,
        epssObservedAt: latestEpssObservedAt?.toISOString() ?? null,
      },
      counts: {
        vulnerabilities: typedVulnerabilities.length,
        p0: typedVulnerabilities.filter(
          (vulnerability) => vulnerability.priority === 'P0',
        ).length,
        p1: typedVulnerabilities.filter(
          (vulnerability) => vulnerability.priority === 'P1',
        ).length,
        kevAdvisories: typedKevAdvisories.length,
        enabledWatchlistEntries: typedWatchlistEntries.length,
      },
    };
  }

  async syncRecent(lookbackHours?: number): Promise<IngestSyncResponse> {
    const client = await this.prismaService.getClient();

    if (!client) {
      throw new Error(
        'Database client is not ready. Sync requires a live database connection.',
      );
    }

    const startedAt = new Date();
    const effectiveLookbackHours =
      lookbackHours ?? this.appConfigService.ingestLookbackHours;

    const nvdVulnerabilities = await this.nvdCollector.fetchRecent(
      effectiveLookbackHours,
    );
    const kevEntries = await this.kevCollector.fetchCatalog();

    const vulnerabilityMap = new Map<string, ProcessedVulnerabilitySnapshot>();

    for (const vulnerability of nvdVulnerabilities) {
      vulnerabilityMap.set(vulnerability.cveId, {
        cveId: vulnerability.cveId,
        title: vulnerability.title,
        description: vulnerability.description,
        severity: vulnerability.severity,
        cvssScore: vulnerability.cvssScore,
        epssScore: null,
        epssPercentile: null,
        isKev: false,
        matchedValues: [],
        riskScore: 0,
        priority: 'P3',
        publishedAt: vulnerability.publishedAt,
        lastModifiedAt: vulnerability.lastModifiedAt,
        rawSourceJson: vulnerability.rawSourceJson,
      });
    }

    for (const kevEntry of kevEntries) {
      const existing = vulnerabilityMap.get(kevEntry.cveId);

      if (existing) {
        existing.isKev = true;
        continue;
      }

      vulnerabilityMap.set(kevEntry.cveId, {
        cveId: kevEntry.cveId,
        title: kevEntry.vulnerabilityName,
        description: kevEntry.shortDescription,
        severity: null,
        cvssScore: null,
        epssScore: null,
        epssPercentile: null,
        isKev: true,
        matchedValues: [],
        riskScore: 0,
        priority: 'P3',
        publishedAt: new Date(`${kevEntry.dateAdded}T00:00:00.000Z`),
        lastModifiedAt: new Date(`${kevEntry.dateAdded}T00:00:00.000Z`),
        rawSourceJson: {
          source: 'cisa-kev',
          vendorProject: kevEntry.vendorProject,
          product: kevEntry.product,
          requiredAction: kevEntry.requiredAction,
          dueDate: kevEntry.dueDate,
        },
      });
    }

    const epssScores = await this.epssCollector.fetchScores([
      ...vulnerabilityMap.keys(),
    ]);

    for (const epssScore of epssScores) {
      const vulnerability = vulnerabilityMap.get(epssScore.cveId);

      if (!vulnerability) {
        continue;
      }

      vulnerability.epssScore = epssScore.score;
      vulnerability.epssPercentile = epssScore.percentile;
    }

    const watchlistEntries = (await client.watchlistEntry.findMany({
      where: { enabled: true },
      select: {
        id: true,
        type: true,
        value: true,
        enabled: true,
      },
    })) as DbWatchlistEntry[];

    let watchMatchCount = 0;

    for (const vulnerability of vulnerabilityMap.values()) {
      const searchableText =
        `${vulnerability.title} ${vulnerability.description} ${JSON.stringify(
          vulnerability.rawSourceJson,
        )}`.toLowerCase();

      const matchedEntries = watchlistEntries.filter((entry) =>
        searchableText.includes(entry.value.toLowerCase()),
      );
      vulnerability.matchedValues = matchedEntries.map((entry) => entry.value);

      const score = calculateRiskScore({
        severity: vulnerability.severity,
        isKev: vulnerability.isKev,
        epssPercentile: vulnerability.epssPercentile,
        matchedValues: vulnerability.matchedValues,
        title: vulnerability.title,
        description: vulnerability.description,
      });

      vulnerability.riskScore = score.score;
      vulnerability.priority = score.priority;

      await client.vulnerability.upsert({
        where: {
          cveId: vulnerability.cveId,
        },
        update: {
          title: vulnerability.title,
          description: vulnerability.description,
          severity: vulnerability.severity,
          cvssScore: vulnerability.cvssScore,
          epssScore: vulnerability.epssScore,
          epssPercentile: vulnerability.epssPercentile,
          isKev: vulnerability.isKev,
          riskScore: vulnerability.riskScore,
          priority: vulnerability.priority,
          publishedAt: vulnerability.publishedAt,
          lastModifiedAt: vulnerability.lastModifiedAt,
          rawSourceJson: vulnerability.rawSourceJson,
        },
        create: {
          cveId: vulnerability.cveId,
          title: vulnerability.title,
          description: vulnerability.description,
          severity: vulnerability.severity,
          cvssScore: vulnerability.cvssScore,
          epssScore: vulnerability.epssScore,
          epssPercentile: vulnerability.epssPercentile,
          isKev: vulnerability.isKev,
          riskScore: vulnerability.riskScore,
          priority: vulnerability.priority,
          publishedAt: vulnerability.publishedAt,
          lastModifiedAt: vulnerability.lastModifiedAt,
          rawSourceJson: vulnerability.rawSourceJson,
        },
      });

      await client.watchMatch.deleteMany({
        where: {
          vulnerabilityCveId: vulnerability.cveId,
        },
      });

      for (const matchedEntry of matchedEntries) {
        watchMatchCount += 1;

        await client.watchMatch.upsert({
          where: {
            vulnerabilityCveId_watchlistEntryId: {
              vulnerabilityCveId: vulnerability.cveId,
              watchlistEntryId: matchedEntry.id,
            },
          },
          update: {
            matchedValue: matchedEntry.value,
          },
          create: {
            vulnerabilityCveId: vulnerability.cveId,
            watchlistEntryId: matchedEntry.id,
            matchedValue: matchedEntry.value,
          },
        });
      }
    }

    for (const kevEntry of kevEntries) {
      await client.advisory.upsert({
        where: {
          vulnerabilityCveId_source_externalId: {
            vulnerabilityCveId: kevEntry.cveId,
            source: 'cisa-kev',
            externalId: `kev-${kevEntry.cveId}`,
          },
        },
        update: {
          title: kevEntry.vulnerabilityName,
          summary: kevEntry.shortDescription,
          sourceUrl:
            'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
          publishedAt: new Date(`${kevEntry.dateAdded}T00:00:00.000Z`),
          lastModifiedAt: new Date(`${kevEntry.dateAdded}T00:00:00.000Z`),
          rawSourceJson: kevEntry as unknown as Record<string, unknown>,
        },
        create: {
          vulnerabilityCveId: kevEntry.cveId,
          source: 'cisa-kev',
          externalId: `kev-${kevEntry.cveId}`,
          title: kevEntry.vulnerabilityName,
          summary: kevEntry.shortDescription,
          sourceUrl:
            'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
          publishedAt: new Date(`${kevEntry.dateAdded}T00:00:00.000Z`),
          lastModifiedAt: new Date(`${kevEntry.dateAdded}T00:00:00.000Z`),
          rawSourceJson: kevEntry as unknown as Record<string, unknown>,
        },
      });
    }

    for (const epssScore of epssScores) {
      await client.epssScore.upsert({
        where: {
          vulnerabilityCveId_observedAt: {
            vulnerabilityCveId: epssScore.cveId,
            observedAt: epssScore.observedAt,
          },
        },
        update: {
          score: epssScore.score,
          percentile: epssScore.percentile,
        },
        create: {
          vulnerabilityCveId: epssScore.cveId,
          score: epssScore.score,
          percentile: epssScore.percentile,
          observedAt: epssScore.observedAt,
        },
      });
    }

    const completedAt = new Date();

    return {
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      lookbackHours: effectiveLookbackHours,
      sources: this.getSources(),
      counts: {
        nvdVulnerabilities: nvdVulnerabilities.length,
        kevEntries: kevEntries.length,
        epssScores: epssScores.length,
        watchMatches: watchMatchCount,
        processedVulnerabilities: vulnerabilityMap.size,
      },
    };
  }
}
