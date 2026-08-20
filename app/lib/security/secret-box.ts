import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const PREFIX = "enc:v1:";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey() {
  const raw =
    process.env.INTEGRATION_SECRETS_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "routine-app-dev-secrets";
  return createHash("sha256").update(`routine-app-secrets:${raw}`).digest();
}

export function isEncryptedSecret(value: string | null | undefined) {
  return Boolean(value?.startsWith(PREFIX));
}

export function encryptSecret(plain: string | null | undefined): string {
  const value = plain?.trim() ?? "";
  if (!value) return "";
  if (value.startsWith(PREFIX)) return value;

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
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
    const iv = packed.subarray(0, IV_LENGTH);
    const tag = packed.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = packed.subarray(IV_LENGTH + TAG_LENGTH);
    const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
      "utf8",
    );
  } catch {
    return "";
  }
}

export function persistSecret(value: string | null | undefined): string | null {
  const encrypted = encryptSecret(decryptSecret(value));
  return encrypted || null;
}
