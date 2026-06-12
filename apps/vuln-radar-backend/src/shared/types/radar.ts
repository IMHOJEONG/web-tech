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
}

export interface FeedResponse {
  generatedAt: string;
  dataSource: RadarDataSource;
  items: FeedItem[];
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
