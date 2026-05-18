export interface AppConfig {
  appEnv: string;
  appPort: number;
  corsOrigin: string;
  frontendOrigin: string;
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

export function getAppConfig(): AppConfig {
  return {
    appEnv: readStringEnv('APP_ENV', 'development'),
    appPort: readNumberEnv('PORT', 4000),
    corsOrigin: readStringEnv('CORS_ORIGIN', 'http://localhost:3000'),
    frontendOrigin: readStringEnv('FRONTEND_ORIGIN', 'http://localhost:3000'),
    serviceName: 'vuln-radar-backend',
  };
}
