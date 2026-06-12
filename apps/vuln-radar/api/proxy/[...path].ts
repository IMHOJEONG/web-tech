const INTERNAL_PROXY_PREFIX = "/api/proxy";
const PUBLIC_PROXY_PREFIX = "/api/backend";

const HOP_BY_HOP_HEADERS = [
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
];

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function joinUrlPaths(...segments: string[]) {
  return segments
    .filter(Boolean)
    .map((segment, index) => {
      if (index === 0) {
        return segment.replace(/\/+$/, "");
      }

      return segment.replace(/^\/+/, "").replace(/\/+$/, "");
    })
    .join("/");
}

function getBackendOrigin() {
  const value = process.env.VULN_RADAR_BACKEND_ORIGIN?.trim();

  if (!value) {
    throw new Error("VULN_RADAR_BACKEND_ORIGIN is not configured.");
  }

  const url = new URL(value);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("VULN_RADAR_BACKEND_ORIGIN must use http or https.");
  }

  return trimTrailingSlash(url.toString());
}

function getRequestOrigin(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.trim();
  const host = request.headers.get("host")?.trim();

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  if (host) {
    return `https://${host}`;
  }

  return "https://localhost";
}

function stripKnownProxyPrefix(pathname: string) {
  if (pathname.startsWith(INTERNAL_PROXY_PREFIX)) {
    return pathname.slice(INTERNAL_PROXY_PREFIX.length);
  }

  if (pathname.startsWith(PUBLIC_PROXY_PREFIX)) {
    return pathname.slice(PUBLIC_PROXY_PREFIX.length);
  }

  return pathname;
}

function buildUpstreamUrl(request: Request, backendOrigin: string) {
  const incomingUrl = new URL(request.url, getRequestOrigin(request));
  const proxyPath = stripKnownProxyPrefix(incomingUrl.pathname);
  const upstreamUrl = new URL(backendOrigin);

  upstreamUrl.pathname = joinUrlPaths(upstreamUrl.pathname, "/api", proxyPath);
  upstreamUrl.search = incomingUrl.search;

  return upstreamUrl;
}

function createUpstreamHeaders(request: Request) {
  const headers = new Headers(request.headers);
  const backendApiToken = process.env.VULN_RADAR_BACKEND_API_TOKEN?.trim();

  HOP_BY_HOP_HEADERS.forEach((header) => headers.delete(header));

  // Browser clients should keep calling the frontend origin only.
  // When the upstream backend is protected, inject the shared token here.
  if (backendApiToken && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${backendApiToken}`);
  }

  return headers;
}

function createResponseHeaders(upstreamResponse: Response) {
  const headers = new Headers(upstreamResponse.headers);

  HOP_BY_HOP_HEADERS.forEach((header) => headers.delete(header));

  return headers;
}

export default async function handler(request: Request) {
  try {
    const backendOrigin = getBackendOrigin();
    const upstreamUrl = buildUpstreamUrl(request, backendOrigin);
    const method = request.method.toUpperCase();

    console.log("[vuln-radar proxy] request received", {
      method,
      requestUrl: request.url,
      backendOrigin,
      upstreamUrl: upstreamUrl.toString(),
    });

    console.log("[vuln-radar proxy] starting upstream fetch", {
      method,
      upstreamUrl: upstreamUrl.toString(),
    });

    const upstreamResponse = await fetch(upstreamUrl, {
      method,
      headers: createUpstreamHeaders(request),
      body: method === "GET" || method === "HEAD" ? undefined : request.body,
      redirect: "manual",
    });

    console.log("[vuln-radar proxy] upstream response received", {
      method,
      upstreamUrl: upstreamUrl.toString(),
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
    });

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: createResponseHeaders(upstreamResponse),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown proxy error while forwarding the request.";

    console.error("[vuln-radar proxy] upstream fetch failed", {
      requestUrl: request.url,
      message,
      error,
    });

    return Response.json(
      {
        status: "error",
        message,
      },
      { status: 502 },
    );
  }
}
