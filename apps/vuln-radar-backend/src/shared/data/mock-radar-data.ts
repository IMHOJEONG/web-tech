import {
  AlertItem,
  AlertsResponse,
  FeedItem,
  FeedResponse,
  KevItem,
  KevResponse,
  OverviewCard,
  OverviewResponse,
  RadarDataSource,
  RadarDataSourceReason,
  VulnerabilityDetailResponse,
  WatchlistEntry,
  WatchlistResponse,
} from '../types/radar';
import {
  advisorySeeds,
  radarGeneratedAt,
  vulnerabilitySeeds,
  watchMatchSeeds,
} from './radar-seed-data';

const GENERATED_AT = radarGeneratedAt;

const overviewCards: OverviewCard[] = [
  {
    id: 'p0-open',
    label: 'Open P0',
    value: 2,
    priority: 'P0',
    deltaLabel: '+1 since last sync',
  },
  {
    id: 'p1-open',
    label: 'Open P1',
    value: 5,
    priority: 'P1',
    deltaLabel: '+2 since last sync',
  },
  {
    id: 'kev-new',
    label: 'New KEV',
    value: 1,
    priority: 'P1',
    deltaLabel: 'CISA catalog changed today',
  },
];

const feedItems: FeedItem[] = [
  {
    cveId: 'CVE-2026-10001',
    title: 'Citrix NetScaler gateway auth bypass under active exploitation',
    priority: 'P0',
    severity: 'critical',
    epssScore: 0.98,
    isKev: true,
    publishedAt: '2026-05-18T02:12:00.000Z',
    updatedAt: '2026-05-18T06:40:00.000Z',
    matchedWatchlist: ['citrix', 'gateway'],
  },
  {
    cveId: 'CVE-2026-10019',
    title: 'Kubernetes ingress controller remote code execution candidate',
    priority: 'P1',
    severity: 'high',
    epssScore: 0.91,
    isKev: false,
    publishedAt: '2026-05-17T18:30:00.000Z',
    updatedAt: '2026-05-18T05:15:00.000Z',
    matchedWatchlist: ['kubernetes'],
  },
  {
    cveId: 'CVE-2026-10044',
    title: 'PostgreSQL extension privilege escalation with public PoC',
    priority: 'P1',
    severity: 'high',
    epssScore: 0.87,
    isKev: false,
    publishedAt: '2026-05-17T22:50:00.000Z',
    updatedAt: '2026-05-18T04:02:00.000Z',
    matchedWatchlist: ['postgresql'],
  },
];

const watchlistEntries: WatchlistEntry[] = [
  {
    id: 'vendor-citrix',
    type: 'vendor',
    value: 'citrix',
    matchCount: 1,
  },
  {
    id: 'product-kubernetes',
    type: 'product',
    value: 'kubernetes',
    matchCount: 1,
  },
  {
    id: 'ecosystem-pypi',
    type: 'ecosystem',
    value: 'pypi',
    matchCount: 0,
  },
  {
    id: 'keyword-auth-bypass',
    type: 'keyword',
    value: 'auth bypass',
    matchCount: 1,
  },
];

const alertItems: AlertItem[] = [
  {
    id: 'alert-001',
    priority: 'P0',
    channel: 'slack',
    status: 'sent',
    title: 'Citrix NetScaler auth bypass matched watchlist',
    sentAt: '2026-05-18T06:45:00.000Z',
  },
  {
    id: 'alert-002',
    priority: 'P1',
    channel: 'discord',
    status: 'pending',
    title: 'Kubernetes ingress controller candidate needs review',
    sentAt: '2026-05-18T06:50:00.000Z',
  },
];

const kevItems: KevItem[] = [
  {
    cveId: 'CVE-2026-10001',
    title: 'Citrix NetScaler gateway auth bypass under active exploitation',
    priority: 'P0',
    sourceUrl: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
    addedAt: '2026-05-18T05:30:00.000Z',
  },
];

type MockFallbackReason = Extract<
  RadarDataSourceReason,
  'database_unavailable' | 'no_database_rows'
>;

function buildMockDataSource(
  resourceLabel: string,
  reason: MockFallbackReason = 'database_unavailable',
): RadarDataSource {
  if (reason === 'no_database_rows') {
    return {
      kind: 'mock',
      reason,
      message: `${resourceLabel} is using seed mock data because no ingested database rows are available yet.`,
    };
  }

  return {
    kind: 'mock',
    reason,
    message: `${resourceLabel} is using seed mock data because the database connection is currently unavailable.`,
  };
}

export function getOverviewResponse(
  reason: MockFallbackReason = 'database_unavailable',
): OverviewResponse {
  return {
    generatedAt: GENERATED_AT,
    dataSource: buildMockDataSource('Overview', reason),
    cards: overviewCards,
    highlights: [
      'KEV + watchlist match signals are elevated.',
      'EPSS-heavy P1 items are ready for feed triage.',
    ],
  };
}

export function getFeedResponse(
  reason: MockFallbackReason = 'database_unavailable',
): FeedResponse {
  return {
    generatedAt: GENERATED_AT,
    dataSource: buildMockDataSource('Feed', reason),
    items: feedItems,
  };
}

export function getWatchlistResponse(
  reason: MockFallbackReason = 'database_unavailable',
): WatchlistResponse {
  return {
    generatedAt: GENERATED_AT,
    dataSource: buildMockDataSource('Watchlist', reason),
    entries: watchlistEntries,
  };
}

export function getKevResponse(
  reason: MockFallbackReason = 'database_unavailable',
): KevResponse {
  return {
    generatedAt: GENERATED_AT,
    dataSource: buildMockDataSource('KEV', reason),
    items: kevItems,
  };
}

export function getAlertsResponse(
  reason: MockFallbackReason = 'database_unavailable',
): AlertsResponse {
  return {
    generatedAt: GENERATED_AT,
    dataSource: buildMockDataSource('Alerts', reason),
    items: alertItems,
  };
}

export function getVulnerabilityDetailResponse(
  cveId: string,
  reason: MockFallbackReason = 'database_unavailable',
): VulnerabilityDetailResponse | null {
  const vulnerability = vulnerabilitySeeds.find((item) => item.cveId === cveId);

  if (!vulnerability) {
    return null;
  }

  const advisories = advisorySeeds
    .filter((item) => item.vulnerabilityCveId === cveId)
    .map((item) => ({
      source: item.source,
      title: item.title ?? null,
      summary: item.summary ?? null,
      sourceUrl: item.sourceUrl ?? null,
      publishedAt: item.publishedAt?.toISOString() ?? null,
      lastModifiedAt: item.lastModifiedAt?.toISOString() ?? null,
    }));

  const matchedWatchlist = watchMatchSeeds
    .filter((item) => item.vulnerabilityCveId === cveId)
    .map((item) => item.matchedValue);

  return {
    generatedAt: GENERATED_AT,
    dataSource: buildMockDataSource('Vulnerability detail', reason),
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
      matchedWatchlist,
      advisories,
      references: {
        nvdUrl: `https://nvd.nist.gov/vuln/detail/${vulnerability.cveId}`,
      },
    },
  };
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
