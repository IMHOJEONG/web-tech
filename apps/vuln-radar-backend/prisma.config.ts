import { loadEnvFile } from 'node:process';
import { defineConfig } from 'prisma/config';
import {
  resolveDirectDatabaseUrl,
  resolveShadowDatabaseUrl,
} from './src/infra/prisma/direct-connection';

loadEnvFile('.env');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: resolveDirectDatabaseUrl(),
    shadowDatabaseUrl: resolveShadowDatabaseUrl(),
  },
});
