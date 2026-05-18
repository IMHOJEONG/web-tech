import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { resolveDirectDatabaseUrl } from './direct-connection';

interface PrismaLikeClient {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  vulnerability: {
    findMany: (args?: unknown) => Promise<unknown[]>;
    upsert: (args: unknown) => Promise<unknown>;
  };
  watchlistEntry: {
    findMany: (args?: unknown) => Promise<unknown[]>;
  };
  watchMatch: {
    deleteMany: (args?: unknown) => Promise<unknown>;
    upsert: (args: unknown) => Promise<unknown>;
  };
  advisory: {
    findMany: (args?: unknown) => Promise<unknown[]>;
    upsert: (args: unknown) => Promise<unknown>;
  };
  epssScore: {
    findMany: (args?: unknown) => Promise<unknown[]>;
    upsert: (args: unknown) => Promise<unknown>;
  };
  alert: {
    findMany: (args?: unknown) => Promise<unknown[]>;
  };
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private client: PrismaLikeClient | null = null;
  private initialized = false;
  private enabled = Boolean(process.env.DATABASE_URL);

  async onModuleInit() {
    await this.ensureInitialized();
  }

  async onModuleDestroy() {
    await this.client?.$disconnect();
  }

  get isEnabled() {
    return this.enabled;
  }

  get isReady() {
    return this.client !== null;
  }

  async ensureInitialized() {
    if (this.initialized || !this.enabled) {
      return;
    }

    this.initialized = true;

    try {
      const generatedClientEntryUrl = pathToFileURL(
        join(process.cwd(), 'generated', 'prisma', 'index.js'),
      ).href;
      const prismaModule = await import(generatedClientEntryUrl);
      const adapter = new PrismaPg({
        connectionString: resolveDirectDatabaseUrl(),
      });
      const prismaClient = new prismaModule.PrismaClient({
        adapter,
      }) as PrismaLikeClient;

      await prismaClient.$connect();
      this.client = prismaClient;
    } catch (error) {
      this.client = null;
      this.logger.warn(
        `Prisma client initialization skipped: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  async getClient() {
    await this.ensureInitialized();
    return this.client;
  }
}
