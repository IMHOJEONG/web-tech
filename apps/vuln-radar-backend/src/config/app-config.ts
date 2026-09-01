import { loadOptionalEnvFile } from './load-optional-env';

loadOptionalEnvFile();

export interface AppConfig {
  appEnv: string;
  appPort: number;
  backendApiToken?: string;
  corsOrigin: string;
  frontendOrigin: string;
  ingestLookbackHours: number;
  ingestMaxLookbackHours: number;
  ingestSchedulerEnabled: boolean;
  ingestSourceTimeoutMs: number;
  ingestSyncIntervalMinutes: number;
  ingestSyncOnStartup: boolean;
  nvdApiKey?: string;
  nvdRequestMaxRetries: number;
  nvdRequestPageDelayMs: number;
  nvdRequestRetryDelayMs: number;
  nvdResultsPerPage: number;
  serviceName: string;
}

function readStringEnv(name: string, fallback: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
}

function readNumberEnv(name: string, fallback: number) {
  const rawValue = process.env[name]?.trim();

  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new Error(`Invalid numeric env: ${name}=${rawValue}`);
  }

  return parsedValue;
}

function readNonNegativeNumberEnv(name: string, fallback: number) {
  const rawValue = process.env[name]?.trim();

  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw new Error(`Invalid non-negative numeric env: ${name}=${rawValue}`);
  }

  return parsedValue;
}

function readBooleanEnv(name: string, fallback: boolean) {
  const rawValue = process.env[name]?.trim().toLowerCase();

  if (!rawValue) {
    return fallback;
  }

  if (rawValue === 'true') {
    return true;
  }

  if (rawValue === 'false') {
    return false;
  }

  throw new Error(`Invalid boolean env: ${name}=${rawValue}`);
}

export function getAppConfig(): AppConfig {
  const nvdApiKey = process.env.NVD_API_KEY?.trim() || undefined;

  return {
    appEnv: readStringEnv('APP_ENV', 'development'),
    appPort: readNumberEnv('PORT', 4000),
    backendApiToken: process.env.VULN_RADAR_API_TOKEN?.trim() || undefined,
    corsOrigin: readStringEnv('CORS_ORIGIN', 'http://localhost:3000'),
    frontendOrigin: readStringEnv('FRONTEND_ORIGIN', 'http://localhost:3000'),
    ingestLookbackHours: readNumberEnv('INGEST_LOOKBACK_HOURS', 24),
    ingestMaxLookbackHours: readNumberEnv('INGEST_MAX_LOOKBACK_HOURS', 240),
    ingestSchedulerEnabled: readBooleanEnv('INGEST_SCHEDULER_ENABLED', true),
    ingestSourceTimeoutMs: readNumberEnv('INGEST_SOURCE_TIMEOUT_MS', 60_000),
    ingestSyncIntervalMinutes: readNumberEnv(
      'INGEST_SYNC_INTERVAL_MINUTES',
      1440,
    ),
    ingestSyncOnStartup: readBooleanEnv('INGEST_SYNC_ON_STARTUP', false),
    nvdApiKey,
    nvdRequestMaxRetries: readNonNegativeNumberEnv(
      'NVD_REQUEST_MAX_RETRIES',
      2,
    ),
    nvdRequestPageDelayMs: readNonNegativeNumberEnv(
      'NVD_REQUEST_PAGE_DELAY_MS',
      nvdApiKey ? 600 : 6_000,
    ),
    nvdRequestRetryDelayMs: readNonNegativeNumberEnv(
      'NVD_REQUEST_RETRY_DELAY_MS',
      1_500,
    ),
    nvdResultsPerPage: readNumberEnv('NVD_RESULTS_PER_PAGE', 200),
    serviceName: 'vuln-radar-backend',
  };
}
