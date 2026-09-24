import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { readEnv } from "@/app/lib/env/read-env";

const COOKIE = "factory_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

export type FactorySession = {
  id: string;
  exp: number;
};

function signingKey() {
  return (
    readEnv("INTEGRATION_SECRETS_KEY")?.trim() ||
    readEnv("SUPABASE_SERVICE_ROLE_KEY")?.trim() ||
    "routine-app-dev-secrets"
  );
}

function sign(body: string) {
  return createHmac("sha256", signingKey()).update(body).digest("base64url");
}

function signaturesMatch(left: string, right: string) {
  const a = createHash("sha256").update(left).digest();
  const b = createHash("sha256").update(right).digest();
  return timingSafeEqual(a, b);
}

export function secretsMatch(left: string, right: string) {
  return signaturesMatch(left, right);
}

function encodeSession(session: FactorySession) {
  const body = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeFactorySession(value: string | undefined | null): FactorySession | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = value.slice(0, dot);
  const mac = value.slice(dot + 1);
  if (!signaturesMatch(mac, sign(body))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as FactorySession;
    if (!parsed?.id || typeof parsed.exp !== "number") return null;
    if (parsed.exp * 1000 <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function readFactorySession() {
  const jar = await cookies();
  return decodeFactorySession(jar.get(COOKIE)?.value);
}

export async function writeFactorySession(userId: string) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const jar = await cookies();
  jar.set(COOKIE, encodeSession({ id: userId, exp }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearFactorySession() {
  const jar = await cookies();
  jar.set(COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
