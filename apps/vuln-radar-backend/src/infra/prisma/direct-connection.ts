import { loadEnvFile } from 'node:process';

loadEnvFile('.env');

type PrismaPostgresTokenPayload = {
  databaseUrl?: string;
  shadowDatabaseUrl?: string;
};

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function decodePrismaPostgresToken(
  token: string,
): PrismaPostgresTokenPayload | null {
  try {
    const rawPayload = Buffer.from(token, 'base64url').toString('utf8');
    return JSON.parse(rawPayload) as PrismaPostgresTokenPayload;
  } catch {
    return null;
  }
}

export function resolveDirectDatabaseUrl() {
  const directUrl = readEnv('DIRECT_URL');

  if (directUrl) {
    return directUrl;
  }

  const databaseUrl = readEnv('DATABASE_URL');

  if (!databaseUrl) {
    throw new Error('Missing DATABASE_URL or DIRECT_URL.');
  }

  if (!databaseUrl.startsWith('prisma+postgres://')) {
    return databaseUrl;
  }

  const parsedUrl = new URL(databaseUrl);
  const apiKey = parsedUrl.searchParams.get('api_key');

  if (!apiKey) {
    throw new Error('Missing api_key in prisma+postgres DATABASE_URL.');
  }

  const payload = decodePrismaPostgresToken(apiKey);

  if (!payload?.databaseUrl) {
    throw new Error(
      'Could not decode direct database URL from prisma+postgres DATABASE_URL.',
    );
  }

  return payload.databaseUrl;
}

export function resolveShadowDatabaseUrl() {
  const shadowUrl = readEnv('SHADOW_DATABASE_URL');

  if (shadowUrl) {
    return shadowUrl;
  }

  const databaseUrl = readEnv('DATABASE_URL');

  if (!databaseUrl?.startsWith('prisma+postgres://')) {
    return undefined;
  }

  const parsedUrl = new URL(databaseUrl);
  const apiKey = parsedUrl.searchParams.get('api_key');

  if (!apiKey) {
    return undefined;
  }

  const payload = decodePrismaPostgresToken(apiKey);
  return payload?.shadowDatabaseUrl;
}
