import { readFile } from "node:fs/promises";
import { createServer, type ServerResponse } from "node:http";
import { stripTypeScriptTypes } from "node:module";
import { setTimeout as wait } from "node:timers/promises";
import { pathToFileURL } from "node:url";

const DEFAULT_PORT = 4173;
const DEFAULT_DELAY_MS = 1200;
const MAX_DELAY_MS = 3000;
const MODES = ["baseline", "slow-css", "blocking-script", "late-lcp"] as const;

type LabMode = (typeof MODES)[number];

type AssetDefinition = {
  contentType: string;
  fileUrl: URL;
  transformTypeScript?: boolean;
};

const MODE_SET: ReadonlySet<string> = new Set(MODES);
const ASSETS: Record<string, AssetDefinition> = {
  "/assets/blocking.js": {
    contentType: "text/javascript; charset=utf-8",
    fileUrl: new URL("./assets/blocking.ts", import.meta.url),
    transformTypeScript: true,
  },
  "/assets/hero.svg": {
    contentType: "image/svg+xml",
    fileUrl: new URL("./assets/hero.svg", import.meta.url),
  },
  "/assets/late-lcp.js": {
    contentType: "text/javascript; charset=utf-8",
    fileUrl: new URL("./assets/late-lcp.ts", import.meta.url),
    transformTypeScript: true,
  },
  "/assets/styles.css": {
    contentType: "text/css; charset=utf-8",
    fileUrl: new URL("./assets/styles.css", import.meta.url),
  },
};

function isLabMode(value: string): value is LabMode {
  return MODE_SET.has(value);
}

function parseDelay(value: string | null): number {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.min(Math.max(parsed, 0), MAX_DELAY_MS);
}

function parsePort(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65_535) {
    return DEFAULT_PORT;
  }

  return parsed;
}

function renderNavigation(activeMode: LabMode): string {
  return MODES.map((mode) => {
    const current = mode === activeMode ? ' aria-current="page"' : "";
    return `<a href="/${mode}"${current}>${mode}</a>`;
  }).join("");
}

function renderPage(mode: LabMode, delayMs: number = DEFAULT_DELAY_MS): string {
  const stylesheetDelay = mode === "slow-css" ? delayMs : 0;
  const blockingScript =
    mode === "blocking-script"
      ? `<script src="/assets/blocking.js?delay=${delayMs}"></script>`
      : "";
  const hero =
    mode === "late-lcp"
      ? `<div id="hero-slot" data-delay="${delayMs}"></div>
               <script type="module" src="/assets/late-lcp.js"></script>`
      : '<img class="hero" src="/assets/hero.svg" width="1200" height="600" fetchpriority="high" alt="Layered browser rendering pipeline illustration">';

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Critical Rendering Path Lab: ${mode}</title>
    <link rel="stylesheet" href="/assets/styles.css?delay=${stylesheetDelay}">
    ${blockingScript}
  </head>
  <body data-mode="${mode}">
    <header>
      <p class="eyebrow">HEAP-FORGE LAB</p>
      <nav aria-label="실험 모드">${renderNavigation(mode)}</nav>
    </header>
    <main>
      <p class="mode">MODE / ${mode}</p>
      <h1>첫 화면은 어디에서 늦어지는가</h1>
      <p class="lede">동일한 화면에서 리소스 발견과 응답 시점만 바꾸고 DevTools 기록을 비교합니다.</p>
      ${hero}
    </main>
  </body>
</html>`;
}

async function readAsset(asset: AssetDefinition): Promise<Buffer | string> {
  if (!asset.transformTypeScript) {
    return readFile(asset.fileUrl);
  }

  const source = await readFile(asset.fileUrl, "utf8");
  return stripTypeScriptTypes(source, { mode: "strip" });
}

function send(
  res: ServerResponse,
  statusCode: number,
  contentType: string,
  body: Buffer | string,
  headers: Record<string, string> = {},
): void {
  res.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": contentType,
    ...headers,
  });
  res.end(body);
}

export function createLabServer() {
  return createServer(async (req, res) => {
    const requestUrl = new URL(req.url ?? "/", "http://127.0.0.1");

    if (requestUrl.pathname === "/") {
      res.writeHead(302, { Location: "/baseline" });
      res.end();
      return;
    }

    const mode = requestUrl.pathname.slice(1);

    if (isLabMode(mode)) {
      send(res, 200, "text/html; charset=utf-8", renderPage(mode));
      return;
    }

    const asset = ASSETS[requestUrl.pathname];

    if (asset) {
      const delayMs = parseDelay(requestUrl.searchParams.get("delay"));
      await wait(delayMs);

      const body = await readAsset(asset);
      send(res, 200, asset.contentType, body, {
        "Server-Timing": `injected-delay;dur=${delayMs}`,
      });
      return;
    }

    send(res, 404, "text/plain; charset=utf-8", "Not found");
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const port = parsePort(process.env.PORT);
  const server = createLabServer();

  server.listen(port, "127.0.0.1", () => {
    console.log(`Critical Rendering Path lab: http://127.0.0.1:${port}`);
  });
}
