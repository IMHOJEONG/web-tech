import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/index.js';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { resolveDirectDatabaseUrl } from '../infra/prisma/direct-connection';

const DEFAULT_CONFIG_PATH = 'config/watchlist.entries.json';
const EXAMPLE_CONFIG_PATH = 'config/watchlist.entries.example.json';
const VALID_TYPES = ['vendor', 'product', 'ecosystem', 'keyword'] as const;

type WatchlistType = (typeof VALID_TYPES)[number];

type WatchlistConfigEntry = {
  type: WatchlistType;
  value: string;
  enabled?: boolean;
};

type WatchlistConfig = {
  version: 1;
  entries: WatchlistConfigEntry[];
};

async function main() {
  const { filePath, disableMissing } = parseArgs(process.argv.slice(2));
  console.info('[vuln-radar-backend] loading watchlist config', {
    filePath,
    disableMissing,
  });
  const config = await loadConfig(filePath);
  const normalizedEntries = normalizeEntries(config.entries);
  console.info('[vuln-radar-backend] watchlist config loaded', {
    filePath,
    entries: normalizedEntries.length,
  });

  const adapter = new PrismaPg({
    connectionString: resolveDirectDatabaseUrl(),
  });
  const prisma = new PrismaClient({
    adapter,
  });

  try {
    console.info('[vuln-radar-backend] connecting to database');
    await prisma.$connect();
    console.info('[vuln-radar-backend] database connection established');

    let upsertedCount = 0;
    const totalEntries = normalizedEntries.length;

    for (const [index, entry] of normalizedEntries.entries()) {
      const entryKey = buildEntryKey(entry.type, entry.value);
      console.info('[vuln-radar-backend] upserting watchlist entry', {
        entry: entryKey,
        current: index + 1,
        total: totalEntries,
      });
      try {
        await prisma.watchlistEntry.upsert({
          where: {
            type_value: {
              type: entry.type,
              value: entry.value,
            },
          },
          update: {
            enabled: entry.enabled,
          },
          create: {
            type: entry.type,
            value: entry.value,
            enabled: entry.enabled,
          },
        });
      } catch (error) {
        throw new Error(
          `Failed to upsert watchlist entry ${entryKey}: ${formatError(error)}`,
        );
      }
      upsertedCount += 1;
      console.info('[vuln-radar-backend] watchlist entry upserted', {
        entry: entryKey,
        current: upsertedCount,
        total: totalEntries,
      });
    }

    let disabledCount = 0;

    if (disableMissing) {
      console.info(
        '[vuln-radar-backend] disable-missing enabled, scanning existing entries',
      );
      const desiredKeys = new Set(
        normalizedEntries.map((entry) =>
          buildEntryKey(entry.type, entry.value),
        ),
      );
      const existingEntries = await prisma.watchlistEntry.findMany({
        select: {
          id: true,
          type: true,
          value: true,
          enabled: true,
        },
      });

      for (const entry of existingEntries) {
        if (desiredKeys.has(buildEntryKey(entry.type, entry.value))) {
          continue;
        }

        if (!entry.enabled) {
          continue;
        }

        await prisma.watchlistEntry.update({
          where: {
            id: entry.id,
          },
          data: {
            enabled: false,
          },
        });
        disabledCount += 1;
        console.info('[vuln-radar-backend] watchlist entry disabled', {
          entry: buildEntryKey(entry.type, entry.value),
          disabledCount,
        });
      }
    }

    console.info('[vuln-radar-backend] watchlist upsert complete', {
      sourceFile: filePath,
      entries: normalizedEntries.length,
      upsertedCount,
      disableMissing,
      disabledCount,
    });
  } finally {
    console.info('[vuln-radar-backend] disconnecting from database');
    await prisma.$disconnect();
    console.info('[vuln-radar-backend] database disconnected');
  }
}

function parseArgs(args: string[]) {
  let filePath = DEFAULT_CONFIG_PATH;
  let disableMissing = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '--file') {
      const nextArgument = args[index + 1];

      if (!nextArgument) {
        throw new Error('Missing value for --file');
      }

      filePath = nextArgument;
      index += 1;
      continue;
    }

    if (argument === '--disable-missing') {
      disableMissing = true;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return {
    filePath,
    disableMissing,
  };
}

async function loadConfig(filePath: string): Promise<WatchlistConfig> {
  const resolvedFilePath = isAbsolute(filePath)
    ? filePath
    : resolve(process.cwd(), filePath);

  if (!existsSync(resolvedFilePath)) {
    throw new Error(
      `Watchlist config not found at ${resolvedFilePath}. Create it from ${EXAMPLE_CONFIG_PATH} first.`,
    );
  }

  const fileContents = await readFile(resolvedFilePath, 'utf8');
  const parsedJson = JSON.parse(fileContents) as unknown;

  return validateConfig(parsedJson);
}

function validateConfig(value: unknown): WatchlistConfig {
  if (!value || typeof value !== 'object') {
    throw new Error('Watchlist config must be a JSON object.');
  }

  const candidate = value as Record<string, unknown>;

  if (candidate.version !== 1) {
    throw new Error('Watchlist config version must be 1.');
  }

  if (!Array.isArray(candidate.entries)) {
    throw new Error('Watchlist config entries must be an array.');
  }

  return {
    version: 1,
    entries: candidate.entries.map((entry, index) =>
      validateEntry(entry, index),
    ),
  };
}

function validateEntry(value: unknown, index: number): WatchlistConfigEntry {
  if (!value || typeof value !== 'object') {
    throw new Error(`Watchlist entry at index ${index} must be an object.`);
  }

  const candidate = value as Record<string, unknown>;

  if (!isWatchlistType(candidate.type)) {
    throw new Error(
      `Watchlist entry at index ${index} has invalid type: ${String(
        candidate.type,
      )}`,
    );
  }

  if (
    typeof candidate.value !== 'string' ||
    candidate.value.trim().length === 0
  ) {
    throw new Error(
      `Watchlist entry at index ${index} must contain a non-empty string value.`,
    );
  }

  if (
    candidate.enabled !== undefined &&
    typeof candidate.enabled !== 'boolean'
  ) {
    throw new Error(
      `Watchlist entry at index ${index} has invalid enabled flag.`,
    );
  }

  return {
    type: candidate.type,
    value: candidate.value,
    enabled: candidate.enabled,
  };
}

function normalizeEntries(entries: WatchlistConfigEntry[]) {
  const seenKeys = new Set<string>();

  return entries.map((entry) => {
    const normalizedValue = normalizeValue(entry.value);
    const key = buildEntryKey(entry.type, normalizedValue);

    if (seenKeys.has(key)) {
      throw new Error(`Duplicate watchlist entry found: ${key}`);
    }

    seenKeys.add(key);

    return {
      type: entry.type,
      value: normalizedValue,
      enabled: entry.enabled ?? true,
    };
  });
}

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

function buildEntryKey(type: WatchlistType, value: string) {
  return `${type}:${value}`;
}

function isWatchlistType(value: unknown): value is WatchlistType {
  return VALID_TYPES.includes(value as WatchlistType);
}

main().catch((error) => {
  console.error('[vuln-radar-backend] watchlist upsert failed');
  console.error(error);
  process.exit(1);
});

function formatError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return String(error);
  }

  const candidate = error as {
    message?: unknown;
    code?: unknown;
    meta?: unknown;
  };

  const parts: string[] = [];

  if (typeof candidate.message === 'string' && candidate.message.length > 0) {
    parts.push(candidate.message);
  }

  if (typeof candidate.code === 'string' && candidate.code.length > 0) {
    parts.push(`code=${candidate.code}`);
  }

  if (candidate.meta !== undefined) {
    try {
      parts.push(`meta=${JSON.stringify(candidate.meta)}`);
    } catch {
      parts.push('meta=[unserializable]');
    }
  }

  return parts.length > 0 ? parts.join(' | ') : String(error);
}
