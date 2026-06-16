import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { defineConfig, loadEnv } from "vite";
import viteReact from "@vitejs/plugin-react";
import { viteServerEnvSchema } from "./src/shared/config/env.shared";

const currentDirectory = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const rawEnv = loadEnv(mode, currentDirectory, "");
  const serverEnv = viteServerEnvSchema.parse(rawEnv);
  const backendProxyHeaders = serverEnv.VULN_RADAR_BACKEND_API_TOKEN
    ? {
        Authorization: `Bearer ${serverEnv.VULN_RADAR_BACKEND_API_TOKEN}`,
      }
    : undefined;

  return {
    plugins: [viteReact()],
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      host: "0.0.0.0",
      port: 3000,
      proxy: {
        "/api/backend": {
          target: serverEnv.VULN_RADAR_BACKEND_ORIGIN,
          changeOrigin: true,
          headers: backendProxyHeaders,
          rewrite: (path) => path.replace(/^\/api\/backend/, "/api"),
        },
      },
    },
    preview: {
      host: "0.0.0.0",
      port: 3000,
      proxy: {
        "/api/backend": {
          target: serverEnv.VULN_RADAR_BACKEND_ORIGIN,
          changeOrigin: true,
          headers: backendProxyHeaders,
          rewrite: (path) => path.replace(/^\/api\/backend/, "/api"),
        },
      },
    },
  };
});
