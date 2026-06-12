const INTERNAL_PROXY_PREFIX = "/api/proxy";
const PUBLIC_PROXY_PREFIX = "/api/backend";

const HOP_BY_HOP_HEADERS = [
  "connection",
  "content-encoding",
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

type RequestLike = Request & {
  headers?: Headers | Record<string, string | string[] | undefined>;
  url: string;
  method: string;
  body?: unknown;
};

type PlainHeaders = Record<string, string | string[] | undefined>;

type ResponseLike = {
  setHeader(name: string, value: string | string[]): void;
  status(code: number): ResponseLike;
  send(body?: string | Uint8Array): void;
};

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

function getHeaderValue(
  headers: RequestLike["headers"],
  name: string,
): string | undefined {
  if (!headers) {
    return undefined;
  }

  if (headers instanceof Headers) {
    return headers.get(name)?.trim() || undefined;
  }

  const plainHeaders = headers as PlainHeaders;
  const rawValue = plainHeaders[name] ?? plainHeaders[name.toLowerCase()];

  if (Array.isArray(rawValue)) {
    const firstValue = rawValue[0];
    return typeof firstValue === "string"
      ? firstValue.trim() || undefined
      : undefined;
  }

  return typeof rawValue === "string"
    ? rawValue.trim() || undefined
    : undefined;
}

function getRequestOrigin(request: RequestLike) {
  const forwardedProto = getHeaderValue(request.headers, "x-forwarded-proto");
  const forwardedHost = getHeaderValue(request.headers, "x-forwarded-host");
  const host = getHeaderValue(request.headers, "host");

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  if (host) {
    return `https://${host}`;
  }

  return "https://localhost";
}

function isKnownProxyQueryParam(name: string) {
  return name === "...path" || name === "path";
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

function buildUpstreamUrl(request: RequestLike, backendOrigin: string) {
  const incomingUrl = new URL(request.url, getRequestOrigin(request));
  const proxyPath = stripKnownProxyPrefix(incomingUrl.pathname);
  const upstreamUrl = new URL(backendOrigin);

  Array.from(incomingUrl.searchParams.keys()).forEach((name) => {
    if (isKnownProxyQueryParam(name)) {
      incomingUrl.searchParams.delete(name);
    }
  });

  upstreamUrl.pathname = joinUrlPaths(upstreamUrl.pathname, "/api", proxyPath);
  upstreamUrl.search = incomingUrl.searchParams.toString();

  return upstreamUrl;
}

function createUpstreamHeaders(request: RequestLike) {
  const headers = new Headers();
  const backendApiToken = process.env.VULN_RADAR_BACKEND_API_TOKEN?.trim();

  if (request.headers instanceof Headers) {
    request.headers.forEach((value, name) => {
      headers.set(name, value);
    });
  } else if (request.headers) {
    Object.entries(request.headers as PlainHeaders).forEach(([name, value]) => {
      if (!value) {
        return;
      }

      if (Array.isArray(value)) {
        headers.set(name, value.join(", "));
        return;
      }

      headers.set(name, value);
    });
  }

  HOP_BY_HOP_HEADERS.forEach((header) => headers.delete(header));
  headers.delete("accept-encoding");

  // Browser clients should keep calling the frontend origin only.
  // When the upstream backend is protected, inject the shared token here.
  if (backendApiToken && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${backendApiToken}`);
  }

  return headers;
}

function createUpstreamBody(
  request: RequestLike,
  method: string,
  headers: Headers,
): BodyInit | undefined {
  if (method === "GET" || method === "HEAD") {
    return undefined;
  }

  const body = request.body;

  if (body == null) {
    return undefined;
  }

  if (
    typeof body === "string" ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body) ||
    body instanceof URLSearchParams
  ) {
    return body;
  }

  if (typeof body === "object") {
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json; charset=utf-8");
    }

    return JSON.stringify(body);
  }

  return String(body);
}

function createResponseHeaders(upstreamResponse: Response) {
  const headers = new Headers(upstreamResponse.headers);

  HOP_BY_HOP_HEADERS.forEach((header) => headers.delete(header));

  return headers;
}

async function writeProxyResponse(
  response: ResponseLike,
  upstreamResponse: Response,
) {
  const headers = createResponseHeaders(upstreamResponse);

  headers.forEach((value, name) => {
    response.setHeader(name, value);
  });

  const bodyBuffer = new Uint8Array(await upstreamResponse.arrayBuffer());

  response.status(upstreamResponse.status).send(bodyBuffer);
}

function writeJsonError(
  response: ResponseLike,
  status: number,
  body: Record<string, unknown>,
) {
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.status(status).send(JSON.stringify(body));
}

export default async function handler(
  request: RequestLike,
  response: ResponseLike,
) {
  try {
    const backendOrigin = getBackendOrigin();
    const upstreamUrl = buildUpstreamUrl(request, backendOrigin);
    const method = request.method.toUpperCase();
    const outgoingHeaders = createUpstreamHeaders(request);
    const outgoingBody = createUpstreamBody(request, method, outgoingHeaders);

    console.log("[vuln-radar proxy] request received", {
      method,
      requestUrl: request.url,
      backendOrigin,
      upstreamUrl: upstreamUrl.toString(),
      hasAuthorizationHeader: outgoingHeaders.has("authorization"),
    });

    console.log("[vuln-radar proxy] starting upstream fetch", {
      method,
      upstreamUrl: upstreamUrl.toString(),
    });

    const upstreamResponse = await fetch(upstreamUrl, {
      method,
      headers: outgoingHeaders,
      body: outgoingBody,
      redirect: "manual",
    });

    console.log("[vuln-radar proxy] upstream response received", {
      method,
      upstreamUrl: upstreamUrl.toString(),
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
    });

    await writeProxyResponse(response, upstreamResponse);
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

    writeJsonError(response, 502, {
      status: "error",
      message,
    });
  }
}
