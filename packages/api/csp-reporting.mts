export const CSP_REPORT_LIMITS = Object.freeze({
  bytes: 16 * 1024,
  batch: 10,
  requests: 60,
  windowMs: 60_000,
  bodyTimeoutMs: 2_000,
});

const directives = new Set([
  "default-src",
  "script-src",
  "script-src-elem",
  "script-src-attr",
  "style-src",
  "style-src-elem",
  "style-src-attr",
  "connect-src",
  "img-src",
  "font-src",
  "media-src",
  "object-src",
  "frame-src",
  "child-src",
  "worker-src",
  "manifest-src",
  "base-uri",
  "form-action",
  "frame-ancestors",
  "require-trusted-types-for",
  "trusted-types",
]);

type App = "docs" | "vuln-radar";
type Group = {
  directive: string;
  disposition: "report" | "enforce" | "unknown";
  resource:
    | "inline"
    | "eval"
    | "wasm-eval"
    | "trusted-types"
    | "network"
    | "data"
    | "blob"
    | "extension"
    | "other";
  document:
    | "article"
    | "index"
    | "feed"
    | "overview"
    | "other"
    | "external"
    | "unknown";
  status: "1xx" | "2xx" | "3xx" | "4xx" | "5xx" | "unknown";
  count: number;
};

export type CspReportSummary = {
  event: "csp-report-summary";
  schemaVersion: 1;
  app: App;
  groups: Group[];
};

class ReportError extends Error {
  status: number;
  constructor(status: number) {
    super("Invalid CSP report request");
    this.status = status;
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resource(value: unknown): Group["resource"] {
  if (value === "inline" || value === "eval" || value === "wasm-eval")
    return value;
  if (value === "trusted-types-sink" || value === "trusted-types-policy")
    return "trusted-types";
  if (typeof value !== "string") return "other";
  if (/^https?:/i.test(value)) return "network";
  if (/^data:/i.test(value)) return "data";
  if (/^blob:/i.test(value)) return "blob";
  if (/^(?:chrome|moz|safari-web)-extension:/i.test(value)) return "extension";
  return "other";
}

function documentGroup(
  value: unknown,
  origin: string,
  app: App,
): Group["document"] {
  if (typeof value !== "string") return "unknown";
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol)) return "unknown";
    if (url.origin !== origin) return "external";
    const path =
      url.pathname.replace(/^\/(?:ko|en)(?=\/|$)/, "").replace(/\/+$/, "") ||
      "/";
    if (app === "docs") {
      if (
        /^\/docs\/.+/.test(path) ||
        /^\/category\/[^/]+\/[^/]+\/[^/]+$/.test(path)
      )
        return "article";
      if (
        ["/", "/docs", "/category", "/web", "/ui-ux", "/mobile"].includes(
          path,
        ) ||
        path.startsWith("/category/")
      )
        return "index";
    }
    if (path === "/feed") return "feed";
    if (app === "vuln-radar" && path === "/overview") return "overview";
    return "other";
  } catch {
    return "unknown";
  }
}

function normalize(
  body: unknown,
  modern: boolean,
  origin: string,
  app: App,
): Group | null {
  if (!record(body)) return null;
  const directive = body[modern ? "effectiveDirective" : "effective-directive"];
  if (typeof directive !== "string" || !directives.has(directive)) return null;
  const disposition = body.disposition ?? "unknown";
  if (
    disposition !== "report" &&
    disposition !== "enforce" &&
    disposition !== "unknown"
  )
    return null;
  const status = body[modern ? "statusCode" : "status-code"];
  return {
    directive,
    disposition,
    resource: resource(body[modern ? "blockedURL" : "blocked-uri"]),
    document: documentGroup(
      body[modern ? "documentURL" : "document-uri"],
      origin,
      app,
    ),
    status:
      typeof status === "number" &&
      Number.isInteger(status) &&
      status >= 100 &&
      status < 600
        ? (`${Math.floor(status / 100)}xx` as Group["status"])
        : "unknown",
    count: 1,
  };
}

async function readBody(request: Request, timeoutMs: number): Promise<unknown> {
  if (!request.body) throw new ReportError(400);
  const reader = request.body.getReader();
  let complete = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort: () => void = () => {};
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ReportError(408)), timeoutMs);
  });
  const aborted = new Promise<never>((_, reject) => {
    onAbort = () => reject(new ReportError(408));
    request.signal.addEventListener("abort", onAbort, { once: true });
    if (request.signal.aborted) onAbort();
  });
  const chunks: Uint8Array[] = [];
  let size = 0;
  let reads = 0;
  try {
    while (true) {
      const next = await Promise.race([reader.read(), deadline, aborted]);
      if (next.done) break;
      // Bound even empty chunks, which otherwise need not advance the byte budget.
      if (++reads > CSP_REPORT_LIMITS.bytes) throw new ReportError(413);
      if (next.value.byteLength === 0) continue;
      size += next.value.byteLength;
      if (size > CSP_REPORT_LIMITS.bytes) throw new ReportError(413);
      chunks.push(next.value);
    }
    complete = true;
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } finally {
    clearTimeout(timer);
    request.signal.removeEventListener("abort", onAbort);
    if (!complete) void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

function response(status: number, extra: Record<string, string> = {}) {
  return new Response(null, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extra,
    },
  });
}

/** Public, untrusted telemetry. The fixed request budget is per collector instance. */
export function createCspReportCollector(options: {
  app: App;
  emit: (summary: CspReportSummary) => void;
  now?: () => number;
  bodyTimeoutMs?: number;
}) {
  const clock = options.now ?? (() => performance.now());
  const timeoutMs = options.bodyTimeoutMs ?? CSP_REPORT_LIMITS.bodyTimeoutMs;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0)
    throw new Error("Invalid report body timeout");
  let started = clock();
  let requests = 0;
  return async function collect(request: Request): Promise<Response> {
    const reject = (status: number, headers?: Record<string, string>) => {
      if (request.body && !request.body.locked)
        void request.body.cancel().catch(() => {});
      return response(status, headers);
    };
    if (request.method !== "POST") return reject(405, { Allow: "POST" });
    const mime = request.headers
      .get("content-type")
      ?.split(";")[0]
      ?.trim()
      .toLowerCase();
    if (
      mime !== "application/reports+json" &&
      mime !== "application/csp-report"
    )
      return reject(415);
    const encoding = request.headers
      .get("content-encoding")
      ?.trim()
      .toLowerCase();
    if (encoding && encoding !== "identity") return reject(415);
    const now = clock();
    if (now < started || now - started >= CSP_REPORT_LIMITS.windowMs) {
      started = now;
      requests = 0;
    }
    if (requests >= CSP_REPORT_LIMITS.requests) {
      return reject(429, {
        "Retry-After": String(
          Math.max(
            1,
            Math.ceil((started + CSP_REPORT_LIMITS.windowMs - now) / 1000),
          ),
        ),
      });
    }
    // Reserve synchronously, before body reads, so concurrent requests share the budget.
    requests++;
    const length = request.headers.get("content-length");
    if (length !== null) {
      if (!/^(?:0|[1-9]\d*)$/.test(length)) return reject(400);
      if (
        !Number.isSafeInteger(Number(length)) ||
        Number(length) > CSP_REPORT_LIMITS.bytes
      )
        return reject(413);
    }
    let value: unknown;
    try {
      value = await readBody(request, timeoutMs);
    } catch (error) {
      return response(error instanceof ReportError ? error.status : 400);
    }
    const modern = mime === "application/reports+json";
    if (modern && (!Array.isArray(value) || value.length === 0))
      return response(400);
    if (Array.isArray(value) && value.length > CSP_REPORT_LIMITS.batch)
      return response(413);
    if (!modern && (!record(value) || !record(value["csp-report"])))
      return response(400);
    const entries: unknown[] = modern ? (value as unknown[]) : [value];
    const groups = new Map<string, Group>();
    for (const entry of entries) {
      if (!record(entry) || (modern && entry.type !== "csp-violation"))
        continue;
      const normalized = normalize(
        entry[modern ? "body" : "csp-report"],
        modern,
        new URL(request.url).origin,
        options.app,
      );
      if (!normalized) continue;
      const key = JSON.stringify(normalized);
      const existing = groups.get(key);
      if (existing) existing.count++;
      else groups.set(key, normalized);
    }
    if (groups.size) {
      try {
        options.emit({
          event: "csp-report-summary",
          schemaVersion: 1,
          app: options.app,
          groups: [...groups.values()],
        });
      } catch {
        return response(503);
      }
    }
    return response(204);
  };
}
