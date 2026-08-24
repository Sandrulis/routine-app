import { encryptSecret, decryptSecret } from "@/app/lib/security/secret-box";

const BRIDGE_TTL_MS = 2 * 60 * 1000;

/** Compact ticket: refresh token only (keeps URL short). */
export type GmailBridgeTicketPayload = {
  refreshToken: string;
  userId: string;
  exp: number;
};

export function createGmailBridgeTicket(input: {
  refreshToken: string;
  userId: string;
}): string {
  const payload: GmailBridgeTicketPayload = {
    refreshToken: input.refreshToken,
    userId: input.userId,
    exp: Date.now() + BRIDGE_TTL_MS,
  };
  return encryptSecret(JSON.stringify(payload));
}

export function parseGmailBridgeTicket(
  raw: string | null | undefined,
): GmailBridgeTicketPayload | null {
  const decrypted = decryptSecret(raw);
  if (!decrypted) return null;
  try {
    const parsed = JSON.parse(decrypted) as Partial<GmailBridgeTicketPayload> & {
      accessToken?: string;
    };
    const refreshToken = String(parsed.refreshToken || "").trim();
    const userId = String(parsed.userId || "").trim();
    const exp = Number(parsed.exp) || 0;
    if (!refreshToken || !userId || exp < Date.now()) {
      return null;
    }
    return { refreshToken, userId, exp };
  } catch {
    return null;
  }
}
