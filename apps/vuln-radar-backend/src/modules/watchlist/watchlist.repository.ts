import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import {
  CreateWatchlistEntryInput,
  UpdateWatchlistEntryInput,
  WatchlistAdminEntry,
} from './watchlist.types';

type DbWatchlistEntry = {
  id: string;
  type: 'vendor' | 'product' | 'ecosystem' | 'keyword';
  value: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class WatchlistRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async listEntries(): Promise<WatchlistAdminEntry[]> {
    const client = await this.getClient();
    const entries = (await client.watchlistEntry.findMany({
      orderBy: [{ enabled: 'desc' }, { type: 'asc' }, { value: 'asc' }],
    })) as DbWatchlistEntry[];

    return entries.map(mapWatchlistEntry);
  }

  async createEntry(
    input: CreateWatchlistEntryInput,
  ): Promise<WatchlistAdminEntry> {
    const client = await this.getClient();

    try {
      const createdEntry = (await client.watchlistEntry.create({
        data: input,
      })) as DbWatchlistEntry;

      return mapWatchlistEntry(createdEntry);
    } catch (error) {
      throw mapPrismaWriteError(error, input.type, input.value);
    }
  }

  async updateEntry(
    id: string,
    input: UpdateWatchlistEntryInput,
  ): Promise<WatchlistAdminEntry> {
    const client = await this.getClient();
    const existingEntry = (await client.watchlistEntry.findUnique({
      where: {
        id,
      },
    })) as DbWatchlistEntry | null;

    if (!existingEntry) {
      throw new NotFoundException(`Watchlist entry ${id} was not found.`);
    }

    const nextType = input.type ?? existingEntry.type;
    const nextValue = input.value ?? existingEntry.value;

    try {
      const updatedEntry = (await client.watchlistEntry.update({
        where: {
          id,
        },
        data: {
          type: nextType,
          value: nextValue,
          enabled: input.enabled ?? existingEntry.enabled,
        },
      })) as DbWatchlistEntry;

      return mapWatchlistEntry(updatedEntry);
    } catch (error) {
      throw mapPrismaWriteError(error, nextType, nextValue);
    }
  }

  async deleteEntry(id: string) {
    const client = await this.getClient();

    try {
      await client.watchlistEntry.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      if (isPrismaRecordNotFound(error)) {
        throw new NotFoundException(`Watchlist entry ${id} was not found.`);
      }

      throw error;
    }
  }

  private async getClient() {
    const client = await this.prismaService.getClient();

    if (!client) {
      throw new ServiceUnavailableException(
        'Database client is not ready for watchlist admin operations.',
      );
    }

    return client;
  }
}

function mapWatchlistEntry(entry: DbWatchlistEntry): WatchlistAdminEntry {
  return {
    id: entry.id,
    type: entry.type,
    value: entry.value,
    enabled: entry.enabled,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

function mapPrismaWriteError(error: unknown, type: string, value: string) {
  if (isPrismaUniqueConstraintError(error)) {
    return new ConflictException(
      `Watchlist entry already exists for ${type}:${value}.`,
    );
  }

  return error;
}

function isPrismaUniqueConstraintError(error: unknown) {
  return (
    !!error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'P2002'
  );
}

function isPrismaRecordNotFound(error: unknown) {
  return (
    !!error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'P2025'
  );
}
