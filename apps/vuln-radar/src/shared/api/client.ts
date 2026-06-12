import { z } from "zod";
import { runtimeConfig } from "@/shared/config/runtime";

const API_TIMEOUT_MS = 8_000;

export class ApiError extends Error {
  readonly status: number | null;
  readonly code: "network" | "http" | "parse";
  readonly details?: unknown;

  constructor(params: {
    message: string;
    status?: number | null;
    code: "network" | "http" | "parse";
    details?: unknown;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.status = params.status ?? null;
    this.code = params.code;
    this.details = params.details;
  }
}

function buildApiUrl(path: string) {
  const normalizedBasePath = runtimeConfig.apiBasePath.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");
  return `${normalizedBasePath}/${normalizedPath}`;
}

export async function getJson<T>(
  path: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(buildApiUrl(path), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ApiError({
        message: `API request failed with ${response.status}`,
        status: response.status,
        code: "http",
      });
    }

    const json = (await response.json()) as unknown;
    const parsed = schema.safeParse(json);

    if (!parsed.success) {
      console.error("[vuln-radar api] schema parse failed", {
        path,
        url: buildApiUrl(path),
        issues: parsed.error.issues,
        response: json,
      });

      throw new ApiError({
        message: "API response shape did not match the expected schema.",
        code: "parse",
        details: parsed.error.issues,
      });
    }

    return parsed.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError({
      message:
        error instanceof Error
          ? error.message
          : "Unknown network error while loading data.",
      code: "network",
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}
