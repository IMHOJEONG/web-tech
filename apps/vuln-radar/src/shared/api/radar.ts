import { z } from "zod";
import { getJson } from "@/shared/api/client";

const radarPrioritySchema = z.enum(["P0", "P1", "P2", "P3"]);
const radarDataSourceSchema = z.object({
  kind: z.enum(["database", "mock"]),
  reason: z.enum([
    "live_read_model",
    "derived_from_feed",
    "database_unavailable",
    "no_database_rows",
  ]),
  message: z.string(),
});

const healthStatusSchema = z.object({
  status: z.literal("ok"),
  service: z.string(),
  env: z.string(),
  frontendOrigin: z.string(),
  storage: z.enum(["mock", "database"]),
});

const overviewCardSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.number(),
  priority: radarPrioritySchema,
  deltaLabel: z.string(),
});

const overviewResponseSchema = z.object({
  generatedAt: z.string(),
  dataSource: radarDataSourceSchema,
  cards: z.array(overviewCardSchema),
  highlights: z.array(z.string()),
});

const feedItemSchema = z.object({
  cveId: z.string(),
  title: z.string(),
  priority: radarPrioritySchema,
  severity: z.enum(["critical", "high", "medium", "low"]),
  epssScore: z.number(),
  isKev: z.boolean(),
  publishedAt: z.string(),
  updatedAt: z.string(),
  matchedWatchlist: z.array(z.string()),
});

const feedResponseSchema = z.object({
  generatedAt: z.string(),
  dataSource: radarDataSourceSchema,
  items: z.array(feedItemSchema),
});

const vulnerabilityAdvisorySchema = z.object({
  source: z.string(),
  title: z.string().nullable(),
  summary: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  publishedAt: z.string().nullable(),
  lastModifiedAt: z.string().nullable(),
});

const vulnerabilityDetailResponseSchema = z.object({
  generatedAt: z.string(),
  item: z.object({
    cveId: z.string(),
    title: z.string(),
    description: z.string(),
    priority: radarPrioritySchema,
    severity: z.enum(["critical", "high", "medium", "low"]),
    cvssScore: z.number().nullable(),
    epssScore: z.number(),
    epssPercentile: z.number().nullable(),
    isKev: z.boolean(),
    riskScore: z.number(),
    publishedAt: z.string(),
    updatedAt: z.string(),
    matchedWatchlist: z.array(z.string()),
    advisories: z.array(vulnerabilityAdvisorySchema),
    references: z.object({
      nvdUrl: z.string().url(),
    }),
  }),
});

const kevItemSchema = z.object({
  cveId: z.string(),
  title: z.string(),
  priority: radarPrioritySchema,
  sourceUrl: z.string().nullable(),
  addedAt: z.string(),
});

const kevResponseSchema = z.object({
  generatedAt: z.string(),
  dataSource: radarDataSourceSchema,
  items: z.array(kevItemSchema),
});

const watchlistEntrySchema = z.object({
  id: z.string(),
  type: z.enum(["vendor", "product", "ecosystem", "keyword"]),
  value: z.string(),
  matchCount: z.number(),
});

const watchlistResponseSchema = z.object({
  generatedAt: z.string(),
  dataSource: radarDataSourceSchema,
  entries: z.array(watchlistEntrySchema),
});

const ingestSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.literal("polling"),
  endpoint: z.string().url(),
  note: z.string(),
});

const ingestStatusResponseSchema = z.object({
  checkedAt: z.string(),
  mode: z.literal("pull"),
  storage: z.enum(["database", "unavailable"]),
  note: z.string(),
  sources: z.array(ingestSourceSchema),
  latest: z.object({
    databaseUpdatedAt: z.string().nullable(),
    upstreamLastModifiedAt: z.string().nullable(),
    kevCatalogAddedAt: z.string().nullable(),
    epssObservedAt: z.string().nullable(),
  }),
  counts: z.object({
    vulnerabilities: z.number(),
    p0: z.number(),
    p1: z.number(),
    kevAdvisories: z.number(),
    enabledWatchlistEntries: z.number(),
  }),
});

export type HealthStatus = z.infer<typeof healthStatusSchema>;
export type RadarDataSource = z.infer<typeof radarDataSourceSchema>;
export type OverviewResponse = z.infer<typeof overviewResponseSchema>;
export type FeedResponse = z.infer<typeof feedResponseSchema>;
export type VulnerabilityDetailResponse = z.infer<
  typeof vulnerabilityDetailResponseSchema
>;
export type KevResponse = z.infer<typeof kevResponseSchema>;
export type WatchlistResponse = z.infer<typeof watchlistResponseSchema>;
export type IngestStatusResponse = z.infer<typeof ingestStatusResponseSchema>;

export function getHealthStatus() {
  return getJson("health", healthStatusSchema);
}

export function getOverview() {
  return getJson("overview", overviewResponseSchema);
}

export function getFeed() {
  return getJson("feed", feedResponseSchema);
}

export function getVulnerabilityDetail(cveId: string) {
  return getJson(
    `vulnerabilities/${encodeURIComponent(cveId)}`,
    vulnerabilityDetailResponseSchema,
  );
}

export function getKev() {
  return getJson("kev", kevResponseSchema);
}

export function getWatchlist() {
  return getJson("watchlist", watchlistResponseSchema);
}

export function getIngestStatus() {
  return getJson("ingest/status", ingestStatusResponseSchema);
}
