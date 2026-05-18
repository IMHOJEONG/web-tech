import type { RadarPriority } from '../../shared/types/radar';

export interface CollectedVulnerability {
  cveId: string;
  title: string;
  description: string;
  severity: string | null;
  cvssScore: number | null;
  publishedAt: Date;
  lastModifiedAt: Date;
  rawSourceJson: Record<string, unknown>;
}

export interface KevCatalogEntry {
  cveId: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  shortDescription: string;
  requiredAction: string;
  dueDate: string;
  dateAdded: string;
}

export interface EpssScoreEntry {
  cveId: string;
  score: number;
  percentile: number;
  observedAt: Date;
}

export interface ExternalApiSource {
  id: string;
  name: string;
  kind: 'polling';
  endpoint: string;
  note: string;
}

export interface IngestSyncResponse {
  startedAt: string;
  completedAt: string;
  lookbackHours: number;
  sources: ExternalApiSource[];
  counts: {
    nvdVulnerabilities: number;
    kevEntries: number;
    epssScores: number;
    watchMatches: number;
    processedVulnerabilities: number;
  };
}

export interface IngestStatusResponse {
  checkedAt: string;
  mode: 'pull';
  storage: 'database' | 'unavailable';
  note: string;
  sources: ExternalApiSource[];
  latest: {
    databaseUpdatedAt: string | null;
    upstreamLastModifiedAt: string | null;
    kevCatalogAddedAt: string | null;
    epssObservedAt: string | null;
  };
  counts: {
    vulnerabilities: number;
    p0: number;
    p1: number;
    kevAdvisories: number;
    enabledWatchlistEntries: number;
  };
}

export interface ProcessedVulnerabilitySnapshot {
  cveId: string;
  title: string;
  description: string;
  severity: string | null;
  cvssScore: number | null;
  epssScore: number | null;
  epssPercentile: number | null;
  isKev: boolean;
  matchedValues: string[];
  riskScore: number;
  priority: RadarPriority;
  publishedAt: Date;
  lastModifiedAt: Date;
  rawSourceJson: Record<string, unknown>;
}
