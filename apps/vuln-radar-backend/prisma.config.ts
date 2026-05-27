import { defineConfig } from 'prisma/config';
import {
  resolveDirectDatabaseUrl,
  resolveShadowDatabaseUrl,
} from './src/infra/prisma/direct-connection';
import { loadOptionalEnvFile } from './src/shared/lib/load-optional-env';

loadOptionalEnvFile('.env');

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
