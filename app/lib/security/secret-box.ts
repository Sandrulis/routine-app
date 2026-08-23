import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { readEnv } from "@/app/lib/env/read-env";
import { logError } from "@/app/lib/security/log-error";

const PREFIX = "enc:v1:";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function uniqueNonEmpty(values: Array<string | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value?.trim() ?? "";
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

function keyMaterials() {
  return uniqueNonEmpty([
    readEnv("INTEGRATION_SECRETS_KEY"),
    readEnv("SUPABASE_SERVICE_ROLE_KEY"),
    "routine-app-dev-secrets",
  ]);
}

function keyFromMaterial(raw: string) {
  return createHash("sha256").update(`routine-app-secrets:${raw}`).digest();
}

function getPrimaryKey() {
  return keyFromMaterial(keyMaterials()[0] ?? "routine-app-dev-secrets");
}

function decryptWithKey(packed: Buffer, key: Buffer) {
  const iv = packed.subarray(0, IV_LENGTH);
  const tag = packed.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = packed.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8",
  );
}

export function isEncryptedSecret(value: string | null | undefined) {
  return Boolean(value?.startsWith(PREFIX));
}

export function encryptSecret(plain: string | null | undefined): string {
  const value = plain?.trim() ?? "";
  if (!value) return "";
  if (value.startsWith(PREFIX)) return value;

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", getPrimaryKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${Buffer.concat([iv, tag, encrypted]).toString("base64url")}`;
}

export function decryptSecret(value: string | null | undefined): string {
  const raw = value?.trim() ?? "";
  if (!raw) return "";
  if (!raw.startsWith(PREFIX)) return raw;

  try {
    const packed = Buffer.from(raw.slice(PREFIX.length), "base64url");
    if (packed.length <= IV_LENGTH + TAG_LENGTH) return "";
    const materials = keyMaterials();
    for (let index = 0; index < materials.length; index += 1) {
      try {
        return decryptWithKey(packed, keyFromMaterial(materials[index]));
      } catch {
        continue;
      }
    }
    logError(
      "decryptSecret failed",
      "INTEGRATION_SECRETS_KEY does not match the key used to encrypt site_integrations secrets",
    );
    return "";
  } catch {
    return "";
  }
}

export function persistSecret(value: string | null | undefined): string | null {
  const encrypted = encryptSecret(decryptSecret(value));
  return encrypted || null;
}
