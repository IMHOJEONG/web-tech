export type RadarPriority = 'P0' | 'P1' | 'P2' | 'P3';
export type RadarDataSourceKind = 'database' | 'mock';
export type RadarDataSourceReason =
  | 'live_read_model'
  | 'derived_from_feed'
  | 'database_unavailable'
  | 'no_database_rows';

export interface RadarDataSource {
  kind: RadarDataSourceKind;
  reason: RadarDataSourceReason;
  message: string;
}

export type VulnerabilityReliabilityLevel =
  | 'verified'
  | 'high'
  | 'medium'
  | 'low'
  | 'unknown';
export type VulnerabilityFreshnessStatus =
  | 'fresh'
  | 'aging'
  | 'stale'
  | 'unknown';
export type VulnerabilityMissingEvidence =
  | 'cvss'
  | 'epss'
  | 'kev'
  | 'advisory'
  | 'affected'
  | 'watchlist'
  | 'mitigation';

export interface VulnerabilityReliability {
  level: VulnerabilityReliabilityLevel;
  confidenceScore: number;
  freshness: {
    status: VulnerabilityFreshnessStatus;
    ingestedAt: string | null;
    upstreamModifiedAt: string | null;
    verifiedAt: string | null;
  };
  evidenceCompleteness: {
    score: number;
    missing: VulnerabilityMissingEvidence[];
  };
  conflicts: Array<{
    type: 'severity' | 'affected' | 'alias' | 'status' | 'score';
    message: string;
    sourceIds: string[];
  }>;
}

export interface OverviewCard {
  id: string;
  label: string;
  value: number;
  priority: RadarPriority;
  deltaLabel: string;
}

export interface OverviewResponse {
  generatedAt: string;
  dataSource: RadarDataSource;
  cards: OverviewCard[];
  highlights: string[];
}

export interface FeedItem {
  cveId: string;
  title: string;
  priority: RadarPriority;
  severity: 'critical' | 'high' | 'medium' | 'low';
  epssScore: number;
  isKev: boolean;
  publishedAt: string;
  updatedAt: string;
  matchedWatchlist: string[];
  reliability: VulnerabilityReliability;
}

export interface FeedResponse {
  generatedAt: string;
  dataSource: RadarDataSource;
  items: FeedItem[];
}

export interface VulnerabilityAdvisoryItem {
  source: string;
  title: string | null;
  summary: string | null;
  sourceUrl: string | null;
  publishedAt: string | null;
  lastModifiedAt: string | null;
}

export interface VulnerabilityDetailItem {
  cveId: string;
  title: string;
  description: string;
  priority: RadarPriority;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cvssScore: number | null;
  epssScore: number;
  epssPercentile: number | null;
  isKev: boolean;
  riskScore: number;
  publishedAt: string;
  updatedAt: string;
  matchedWatchlist: string[];
  reliability: VulnerabilityReliability;
  advisories: VulnerabilityAdvisoryItem[];
  references: {
    nvdUrl: string;
  };
}

export interface VulnerabilityDetailResponse {
  generatedAt: string;
  dataSource: RadarDataSource;
  item: VulnerabilityDetailItem;
}

export interface KevItem {
  cveId: string;
  title: string;
  priority: RadarPriority;
  sourceUrl: string | null;
  addedAt: string;
}

export interface KevResponse {
  generatedAt: string;
  dataSource: RadarDataSource;
  items: KevItem[];
}

export interface WatchlistEntry {
  id: string;
  type: 'vendor' | 'product' | 'ecosystem' | 'keyword';
  value: string;
  matchCount: number;
}

export interface WatchlistResponse {
  generatedAt: string;
  dataSource: RadarDataSource;
  entries: WatchlistEntry[];
}

export interface AlertItem {
  id: string;
  priority: RadarPriority;
  channel: 'slack' | 'discord' | 'telegram';
  status: 'sent' | 'pending';
  title: string;
  sentAt: string;
}

export interface AlertsResponse {
  generatedAt: string;
  dataSource: RadarDataSource;
  items: AlertItem[];
}
