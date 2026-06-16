import { loadOptionalEnvFile } from './load-optional-env';

loadOptionalEnvFile();

export interface AppConfig {
  appEnv: string;
  appPort: number;
  backendApiToken?: string;
  corsOrigin: string;
  frontendOrigin: string;
  ingestLookbackHours: number;
  ingestSchedulerEnabled: boolean;
  ingestSyncIntervalMinutes: number;
  ingestSyncOnStartup: boolean;
  nvdApiKey?: string;
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
  return {
    appEnv: readStringEnv('APP_ENV', 'development'),
    appPort: readNumberEnv('PORT', 4000),
    backendApiToken: process.env.VULN_RADAR_API_TOKEN?.trim() || undefined,
    corsOrigin: readStringEnv('CORS_ORIGIN', 'http://localhost:3000'),
    frontendOrigin: readStringEnv('FRONTEND_ORIGIN', 'http://localhost:3000'),
    ingestLookbackHours: readNumberEnv('INGEST_LOOKBACK_HOURS', 24),
    ingestSchedulerEnabled: readBooleanEnv('INGEST_SCHEDULER_ENABLED', true),
    ingestSyncIntervalMinutes: readNumberEnv(
      'INGEST_SYNC_INTERVAL_MINUTES',
      1440,
    ),
    ingestSyncOnStartup: readBooleanEnv('INGEST_SYNC_ON_STARTUP', false),
    nvdApiKey: process.env.NVD_API_KEY?.trim() || undefined,
    serviceName: 'vuln-radar-backend',
  };
}
