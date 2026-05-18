import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import {
  getAlertsResponse,
  getFeedResponse,
  getOverviewResponse,
  getWatchlistResponse,
} from '../../shared/data/mock-radar-data';
import {
  AlertsResponse,
  FeedResponse,
  OverviewResponse,
  WatchlistResponse,
} from '../../shared/types/radar';

type DbVulnerability = {
  cveId: string;
  title: string;
  severity: string | null;
  epssScore: number | null;
  isKev: boolean;
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

    if (feed.items.length === 0) {
      return getOverviewResponse();
    }

    const p0Count = feed.items.filter((item) => item.priority === 'P0').length;
    const p1Count = feed.items.filter((item) => item.priority === 'P1').length;
    const kevCount = feed.items.filter((item) => item.isKev).length;

    return {
      generatedAt: feed.generatedAt,
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
      return getFeedResponse();
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
      return getFeedResponse();
    }

    return {
      generatedAt: new Date().toISOString(),
      items: vulnerabilities.map((vulnerability) => ({
        cveId: vulnerability.cveId,
        title: vulnerability.title,
        priority: vulnerability.priority,
        severity: normalizeSeverity(vulnerability.severity),
        epssScore: vulnerability.epssScore ?? 0,
        isKev: vulnerability.isKev,
        publishedAt: vulnerability.publishedAt.toISOString(),
        updatedAt: vulnerability.lastModifiedAt.toISOString(),
        matchedWatchlist: vulnerability.watchMatches.map((match) => match.matchedValue),
      })),
    };
  }

  async getWatchlist(): Promise<WatchlistResponse> {
    const client = await this.prismaService.getClient();

    if (!client) {
      return getWatchlistResponse();
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
      return getWatchlistResponse();
    }

    return {
      generatedAt: new Date().toISOString(),
      entries: entries.map((entry) => ({
        id: entry.id,
        type: entry.type,
        value: entry.value,
        matchCount: entry.matches.length,
      })),
    };
  }

  async getAlerts(): Promise<AlertsResponse> {
    const client = await this.prismaService.getClient();

    if (!client) {
      return getAlertsResponse();
    }

    const alerts = (await client.alert.findMany({
      orderBy: [{ createdAt: 'desc' }],
      take: 25,
    })) as DbAlert[];

    if (alerts.length === 0) {
      return getAlertsResponse();
    }

    return {
      generatedAt: new Date().toISOString(),
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
}

function normalizeSeverity(severity: string | null): 'critical' | 'high' | 'medium' | 'low' {
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
