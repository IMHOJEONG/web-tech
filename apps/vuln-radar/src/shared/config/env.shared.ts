import { z } from "zod";

export const publicEnvSchema = z.object({
  VITE_APP_TITLE: z.string().trim().min(1).default("Global Vuln Radar"),
  VITE_API_BASE_PATH: z.string().trim().startsWith("/").default("/api/backend"),
  VITE_DEFAULT_ROUTE: z.enum(["/overview"]).default("/overview"),
});

export const viteServerEnvSchema = z.object({
  VULN_RADAR_BACKEND_ORIGIN: z.string().url().default("http://localhost:4000"),
  VULN_RADAR_BACKEND_API_TOKEN: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ViteServerEnv = z.infer<typeof viteServerEnvSchema>;
