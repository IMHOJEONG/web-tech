import { getPublicEnv } from "./env";

const env = getPublicEnv();

export const runtimeConfig = {
  appTitle: env.VITE_APP_TITLE,
  apiBasePath: env.VITE_API_BASE_PATH,
  defaultRoute: env.VITE_DEFAULT_ROUTE,
} as const;
