import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import {
  getAlertsResponse,
  getFeedResponse,
  getKevResponse,
  getOverviewResponse,
  getVulnerabilityDetailResponse,
  getWatchlistResponse,
} from '../../shared/data/mock-radar-data';
import {
  AlertsResponse,
  FeedResponse,
  KevResponse,
  OverviewResponse,
  RadarDataSource,
  VulnerabilityDetailResponse,
  WatchlistResponse,
} from '../../shared/types/radar';

type DbVulnerability = {
  cveId: string;
  title: string;
  description: string;
  severity: string | null;
  cvssScore: number | null;
  epssScore: number | null;
  epssPercentile: number | null;
  isKev: boolean;
  riskScore: number;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  publishedAt: Date;
  lastModifiedAt: Date;
  watchMatches: Array<{
    matchedValue: string;
  }>;
};

type DbWatchlistEntry = {
  id: string;
  type: 'vendor' | 'product' | 'ecosystem' | 'keyword';
  value: string;
  matches: Array<{ id: string }>;
};

type DbKevAdvisory = {
  vulnerabilityCveId: string;
  sourceUrl: string | null;
  publishedAt: Date | null;
  vulnerability: {
    cveId: string;
    title: string;
    priority: 'P0' | 'P1' | 'P2' | 'P3';
  };
};

type DbVulnerabilityDetail = DbVulnerability & {
  advisories: Array<{
    source: string;
    title: string | null;
    summary: string | null;
    sourceUrl: string | null;
    publishedAt: Date | null;
    lastModifiedAt: Date | null;
  }>;
};

type DbAlert = {
  id: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  channel: 'slack' | 'discord' | 'telegram';
  status: 'pending' | 'sent' | 'failed';
  title: string;
  sentAt: Date | null;
  createdAt: Date;
};

@Injectable()
export class FeedsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async getOverview(): Promise<OverviewResponse> {
    const feed = await this.getFeed();

    if (feed.dataSource.kind === 'mock') {
      return getOverviewResponse(getMockFallbackReason(feed.dataSource.reason));
    }

    const p0Count = feed.items.filter((item) => item.priority === 'P0').length;
    const p1Count = feed.items.filter((item) => item.priority === 'P1').length;
    const kevCount = feed.items.filter((item) => item.isKev).length;

    return {
      generatedAt: feed.generatedAt,
      dataSource: {
        kind: 'database',
        reason: 'derived_from_feed',
        message:
          'Overview cards are derived from the live feed read-model stored in the database.',
      },
      cards: [
        {
          id: 'p0-open',
          label: 'Open P0',
          value: p0Count,
          priority: 'P0',
          deltaLabel: `${p0Count} vulnerabilities currently ranked P0`,
        },
        {
          id: 'p1-open',
          label: 'Open P1',
          value: p1Count,
          priority: 'P1',
          deltaLabel: `${p1Count} vulnerabilities currently ranked P1`,
        },
        {
          id: 'kev-new',
          label: 'KEV Matches',
          value: kevCount,
          priority: kevCount > 0 ? 'P1' : 'P2',
          deltaLabel: `${kevCount} vulnerabilities overlap with KEV`,
        },
      ],
      highlights: [
        'Overview is now derived from the feed read-model when DB data exists.',
        'Frontend can keep the same response shape while ingest work catches up.',
      ],
    };
  }

  async getFeed(): Promise<FeedResponse> {
    const client = await this.prismaService.getClient();

    if (!client) {
      return getFeedResponse('database_unavailable');
    }

    const vulnerabilities = (await client.vulnerability.findMany({
      orderBy: [{ priority: 'asc' }, { lastModifiedAt: 'desc' }],
      include: {
        watchMatches: {
          select: {
            matchedValue: true,
          },
        },
      },
      take: 25,
    })) as DbVulnerability[];

    if (vulnerabilities.length === 0) {
      return getFeedResponse('no_database_rows');
    }

    return {
      generatedAt: new Date().toISOString(),
      dataSource: getDatabaseDataSource(
        'Feed is reading the current vulnerability read-model from the database.',
      ),
      items: vulnerabilities.map((vulnerability) => ({
        cveId: vulnerability.cveId,
        title: vulnerability.title,
        priority: vulnerability.priority,
        severity: normalizeSeverity(vulnerability.severity),
        epssScore: vulnerability.epssScore ?? 0,
        isKev: vulnerability.isKev,
        publishedAt: vulnerability.publishedAt.toISOString(),
        updatedAt: vulnerability.lastModifiedAt.toISOString(),
        matchedWatchlist: vulnerability.watchMatches.map(
          (match) => match.matchedValue,
        ),
      })),
    };
  }

  async getWatchlist(): Promise<WatchlistResponse> {
    const client = await this.prismaService.getClient();

    if (!client) {
      return getWatchlistResponse('database_unavailable');
    }

    const entries = (await client.watchlistEntry.findMany({
      where: { enabled: true },
      include: {
        matches: {
          select: {
            id: true,
          },
        },
      },
      orderBy: [{ type: 'asc' }, { value: 'asc' }],
    })) as DbWatchlistEntry[];

    if (entries.length === 0) {
      return getWatchlistResponse('no_database_rows');
    }

    return {
      generatedAt: new Date().toISOString(),
      dataSource: getDatabaseDataSource(
        'Watchlist coverage is reading enabled entries from the database.',
      ),
      entries: entries.map((entry) => ({
        id: entry.id,
        type: entry.type,
        value: entry.value,
        matchCount: entry.matches.length,
      })),
    };
  }

  async getKev(): Promise<KevResponse> {
    const client = await this.prismaService.getClient();

    if (!client) {
      return getKevResponse('database_unavailable');
    }

    const advisories = (await client.advisory.findMany({
      where: {
        source: 'cisa-kev',
      },
      include: {
        vulnerability: {
          select: {
            cveId: true,
            title: true,
            priority: true,
          },
        },
      },
      orderBy: [{ publishedAt: 'desc' }],
      take: 25,
    })) as DbKevAdvisory[];

    if (advisories.length === 0) {
      return getKevResponse('no_database_rows');
    }

    return {
      generatedAt: new Date().toISOString(),
      dataSource: getDatabaseDataSource(
        'KEV entries are reading advisory records from the database.',
      ),
      items: advisories.map((advisory) => ({
        cveId: advisory.vulnerability.cveId,
        title: advisory.vulnerability.title,
        priority: advisory.vulnerability.priority,
        sourceUrl: advisory.sourceUrl,
        addedAt: (advisory.publishedAt ?? new Date()).toISOString(),
      })),
    };
  }

  async getAlerts(): Promise<AlertsResponse> {
    const client = await this.prismaService.getClient();

    if (!client) {
      return getAlertsResponse('database_unavailable');
    }

    const alerts = (await client.alert.findMany({
      orderBy: [{ createdAt: 'desc' }],
      take: 25,
    })) as DbAlert[];

    if (alerts.length === 0) {
      return getAlertsResponse('no_database_rows');
    }

    return {
      generatedAt: new Date().toISOString(),
      dataSource: getDatabaseDataSource(
        'Alerts are reading notification delivery records from the database.',
      ),
      items: alerts.map((alert) => ({
        id: alert.id,
        priority: alert.priority,
        channel: alert.channel,
        status: alert.status === 'failed' ? 'pending' : alert.status,
        title: alert.title,
        sentAt: (alert.sentAt ?? alert.createdAt).toISOString(),
      })),
    };
  }

  async getVulnerabilityDetail(
    cveId: string,
  ): Promise<VulnerabilityDetailResponse> {
    const client = await this.prismaService.getClient();

    if (!client) {
      const mockResponse = getVulnerabilityDetailResponse(
        cveId,
        'database_unavailable',
      );

      if (mockResponse) {
        return mockResponse;
      }

      throw new NotFoundException(`Vulnerability ${cveId} was not found.`);
    }

    const vulnerability = (await client.vulnerability.findUnique({
      where: {
        cveId,
      },
      include: {
        watchMatches: {
          select: {
            matchedValue: true,
          },
        },
        advisories: {
          select: {
            source: true,
            title: true,
            summary: true,
            sourceUrl: true,
            publishedAt: true,
            lastModifiedAt: true,
          },
          orderBy: [{ publishedAt: 'desc' }],
        },
      },
    })) as DbVulnerabilityDetail | null;

    if (!vulnerability) {
      throw new NotFoundException(`Vulnerability ${cveId} was not found.`);
    }

    return {
      generatedAt: new Date().toISOString(),
      dataSource: getDatabaseDataSource(
        'Vulnerability detail is reading the current database record for this CVE.',
      ),
      item: {
        cveId: vulnerability.cveId,
        title: vulnerability.title,
        description: vulnerability.description,
        priority: vulnerability.priority,
        severity: normalizeSeverity(vulnerability.severity),
        cvssScore: vulnerability.cvssScore ?? null,
        epssScore: vulnerability.epssScore ?? 0,
        epssPercentile: vulnerability.epssPercentile ?? null,
        isKev: vulnerability.isKev,
        riskScore: vulnerability.riskScore,
        publishedAt: vulnerability.publishedAt.toISOString(),
        updatedAt: vulnerability.lastModifiedAt.toISOString(),
        matchedWatchlist: vulnerability.watchMatches.map(
          (match) => match.matchedValue,
        ),
        advisories: vulnerability.advisories.map((advisory) => ({
          source: advisory.source,
          title: advisory.title ?? null,
          summary: advisory.summary ?? null,
          sourceUrl: advisory.sourceUrl ?? null,
          publishedAt: advisory.publishedAt?.toISOString() ?? null,
          lastModifiedAt: advisory.lastModifiedAt?.toISOString() ?? null,
        })),
        references: {
          nvdUrl: `https://nvd.nist.gov/vuln/detail/${vulnerability.cveId}`,
        },
      },
    };
  }
}

function normalizeSeverity(
  severity: string | null,
): 'critical' | 'high' | 'medium' | 'low' {
  const normalizedSeverity = severity?.toLowerCase();

  if (
    normalizedSeverity === 'critical' ||
    normalizedSeverity === 'high' ||
    normalizedSeverity === 'medium'
  ) {
    return normalizedSeverity;
  }

  return 'low';
}

function getDatabaseDataSource(message: string): RadarDataSource {
  return {
    kind: 'database',
    reason: 'live_read_model',
    message,
  };
}

function getMockFallbackReason(
  reason: RadarDataSource['reason'],
): 'database_unavailable' | 'no_database_rows' {
  if (reason === 'no_database_rows') {
    return reason;
  }

  return 'database_unavailable';
}
