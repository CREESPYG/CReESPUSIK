import { CapacitorHttp } from "@capacitor/core";

/**
 * fetch() for youtubei.js in the Android app. A WebView's own fetch can't talk to YouTube's API: it is cross-origin,
 * and the browser adds an Origin header that YouTube rejects. Requests go through Android's HTTP stack instead
 * (Capacitor's native HTTP), with exactly the headers youtubei.js set.
 */

export interface RawRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

export interface RawResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export type Transport = (req: RawRequest) => Promise<RawResponse>;

const capacitorTransport: Transport = async (req) => {
  const res = await CapacitorHttp.request({
    url: req.url,
    method: req.method,
    headers: req.headers,
    data: req.body,
    responseType: "text",
  });
  const body = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
  return { status: res.status, headers: res.headers ?? {}, body };
};

// A current desktop Chrome, for the few requests that carry no session to borrow one from.
const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

/** The browser the request's own body says it comes from (youtubei.js puts it in context.client.userAgent). */
function claimedUserAgent(body: string | undefined): string | undefined {
  if (!body?.startsWith("{")) return undefined;
  try {
    const ua = (JSON.parse(body) as { context?: { client?: { userAgent?: unknown } } }).context?.client?.userAgent;
    return typeof ua === "string" && ua ? ua : undefined;
  } catch {
    return undefined;
  }
}

export function makeFetch(transport: Transport): typeof fetch {
  return async (input, init) => {
    const request = input instanceof Request ? input : null;
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    // A standalone Headers keeps every header youtubei.js set (a Request would drop some, like User-Agent).
    const headers: Record<string, string> = {};
    new Headers(init?.headers ?? request?.headers ?? undefined).forEach((value, key) => {
      headers[key] = value;
    });
    const raw = init?.body ?? undefined;
    const body = raw == null ? undefined : typeof raw === "string" ? raw : await new Response(raw).text();
    // youtubei.js leaves out User-Agent and Origin in a web view, where the browser would add them. These requests
    // skip the browser, so Android would send Java's own "Dalvik/2.1.0 …" with no Origin, while the body claims to be
    // desktop Chrome: a mismatch YouTube's bot checks catch on some networks (search failed there, suggestions didn't).
    // Send what the server sends instead.
    headers["user-agent"] ??= claimedUserAgent(body) ?? DESKTOP_UA;
    if (!headers.origin && new URL(url).pathname.startsWith("/youtubei/")) headers.origin = new URL(url).origin;
    const res = await transport({ url, method: init?.method ?? request?.method ?? "GET", headers, body });
    // Statuses without a body (204, 304) can't be given one.
    const bodyless = res.status === 204 || res.status === 304 || (res.status >= 100 && res.status < 200);
    const response = new Response(bodyless ? null : res.body, { status: res.status, headers: res.headers });
    Object.defineProperty(response, "url", { value: url });
    return response;
  };
}

export const nativeFetch = makeFetch(capacitorTransport);
