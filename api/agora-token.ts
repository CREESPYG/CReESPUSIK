import type { IncomingMessage, ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as agoraTokenNs from "agora-token";

/** agora-token ships as CommonJS: resolve the builder + role at runtime. */
const agoraToken: any = (agoraTokenNs as any).default ?? agoraTokenNs;
const { RtcTokenBuilder, RtcRole } = agoraToken;

/**
 * Agora RTC token server (voice channels).
 *
 * Enabled when AGORA_APP_CERTIFICATE is configured:
 *   - Vercel:  project env var AGORA_APP_CERTIFICATE (production)
 *   - Local:   process env, or AGORA_APP_CERTIFICATE=... in .env.local (never committed)
 *   AGORA_APP_ID defaults to the project App ID when omitted.
 *
 * GET /api/agora-token?channel=voice_TEST1&uid=u-xxxx -> { token }
 *
 * If the certificate is not configured we answer 503 so the client knows to
 * use testing mode (App ID only) or a manual temporary token.
 */

const DEFAULT_APP_ID = "6f35ac1ac6f34d0f912fbfbdca988ae0";

let fileEnv: Record<string, string> | null = null;

function loadFileEnv(): Record<string, string> {
  if (fileEnv) return fileEnv;
  fileEnv = {};
  for (const name of [".env.local", ".env"]) {
    let raw = "";
    try {
      raw = readFileSync(join(process.cwd(), name), "utf8");
    } catch {
      continue;
    }
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*(?:export\s+)?([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m || m[1] in fileEnv) continue;
      let value = m[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      fileEnv[m[1]] = value;
    }
  }
  return fileEnv;
}

/** process.env wins, then .env.local/.env, else empty. */
function getEnv(name: string): string {
  const fromProcess = String(process.env[name] || "").trim();
  if (fromProcess) return fromProcess;
  return (loadFileEnv()[name] || "").trim();
}

/** Token/privilege lifetime: 6 hours. */
const TOKEN_TTL_SECONDS = 6 * 60 * 60;

function sanitizeChannel(raw: string | null): string {
  const clean = String(raw || "").trim().slice(0, 64);
  return clean || "";
}

function sanitizeUid(raw: string | null): string {
  const clean = String(raw || "").trim().slice(0, 200);
  return clean || "";
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");

  const appId = getEnv("AGORA_APP_ID") || DEFAULT_APP_ID;
  const appCertificate = getEnv("AGORA_APP_CERTIFICATE");

  if (!appCertificate) {
    res.statusCode = 503;
    res.end(JSON.stringify({ configured: false, error: "AGORA_APP_CERTIFICATE is not configured on the server" }));
    return;
  }

  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const channel = sanitizeChannel(url.searchParams.get("channel"));
    const uid = sanitizeUid(url.searchParams.get("uid"));

    if (!channel) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Missing channel parameter" }));
      return;
    }

    // RtcRole.PUBLISHER: everyone in the voice channel talks & listens.
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channel,
      uid ? uid : 0,
      RtcRole.PUBLISHER,
      TOKEN_TTL_SECONDS,
      TOKEN_TTL_SECONDS
    );

    res.statusCode = 200;
    res.end(JSON.stringify({ token, channel, uid: uid || null, ttl: TOKEN_TTL_SECONDS }));
  } catch (err: any) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err?.message || "Token generation failed" }));
  }
}
