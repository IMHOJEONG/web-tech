import { BadRequestException } from '@nestjs/common';
import {
  CreateWatchlistEntryInput,
  UpdateWatchlistEntryInput,
  WatchlistType,
} from './watchlist.types';

const VALID_WATCHLIST_TYPES = [
  'vendor',
  'product',
  'ecosystem',
  'keyword',
] as const;

export function parseCreateWatchlistEntryInput(
  value: unknown,
): CreateWatchlistEntryInput {
  if (!value || typeof value !== 'object') {
    throw new BadRequestException('Request body must be a JSON object.');
  }

  const candidate = value as Record<string, unknown>;
  const type = parseWatchlistType(candidate.type, 'type');
  const normalizedValue = parseWatchlistValue(candidate.value, 'value');
  const enabled = parseEnabled(candidate.enabled, true);

  return {
    type,
    value: normalizedValue,
    enabled,
  };
}

export function parseUpdateWatchlistEntryInput(
  value: unknown,
): UpdateWatchlistEntryInput {
  if (!value || typeof value !== 'object') {
    throw new BadRequestException('Request body must be a JSON object.');
  }

  const candidate = value as Record<string, unknown>;
  const parsed: UpdateWatchlistEntryInput = {};

  if (candidate.type !== undefined) {
    parsed.type = parseWatchlistType(candidate.type, 'type');
  }

  if (candidate.value !== undefined) {
    parsed.value = parseWatchlistValue(candidate.value, 'value');
  }

  if (candidate.enabled !== undefined) {
    parsed.enabled = parseEnabled(candidate.enabled, false);
  }

  if (
    parsed.type === undefined &&
    parsed.value === undefined &&
    parsed.enabled === undefined
  ) {
    throw new BadRequestException(
      'At least one of type, value, or enabled must be provided.',
    );
  }

  return parsed;
}

function parseWatchlistType(value: unknown, fieldName: string): WatchlistType {
  if (!VALID_WATCHLIST_TYPES.includes(value as WatchlistType)) {
    throw new BadRequestException(
      `${fieldName} must be one of: ${VALID_WATCHLIST_TYPES.join(', ')}.`,
    );
  }

  return value as WatchlistType;
}

function parseWatchlistValue(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(
      `${fieldName} must be a non-empty string value.`,
    );
  }

  return value.trim().toLowerCase();
}

function parseEnabled(value: unknown, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value !== 'boolean') {
    throw new BadRequestException('enabled must be a boolean value.');
  }

  return value;
}
