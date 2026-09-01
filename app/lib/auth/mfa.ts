import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

export type MfaGate = "ok" | "enroll" | "verify";

type MfaFactor = {
  status: string;
  factor_type?: string;
};

type MfaClient = {
  auth: {
    getUser: () => Promise<{
      data: { user: { id: string; factors?: MfaFactor[] | null } | null };
    }>;
    getSession: () => Promise<{
      data: { session: { access_token: string } | null };
    }>;
    mfa?: {
      getAuthenticatorAssuranceLevel?: (
        jwt?: string,
      ) => Promise<{
        data: {
          currentLevel?: string | null;
          nextLevel?: string | null;
        } | null;
      }>;
    };
  };
};

function isMfaFactor(value: unknown): value is MfaFactor {
  if (!value || typeof value !== "object") return false;
  const factor = value as MfaFactor;
  return typeof factor.status === "string";
}

/** Admin listFactors / getUser may return a flat array or grouped buckets. */
export function normalizeMfaFactors(input: unknown): MfaFactor[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.filter(isMfaFactor);
  }
  if (typeof input !== "object") return [];
  const record = input as Record<string, unknown>;
  if (Array.isArray(record.factors)) {
    return record.factors.filter(isMfaFactor);
  }
  const grouped: MfaFactor[] = [];
  for (const key of ["all", "totp", "phone", "webauthn"]) {
    const items = record[key];
    if (Array.isArray(items)) {
      grouped.push(...items.filter(isMfaFactor));
    }
  }
  return grouped;
}

export function userHasVerifiedTotp(factors?: MfaFactor[] | null): boolean {
  return (factors ?? []).some(
    (factor) => factor.status === "verified" && factor.factor_type === "totp",
  );
}

function decodeJwtPayload(accessToken: string): {
  aal?: string;
  amr?: Array<{ method?: string } | string>;
} | null {
  try {
    return JSON.parse(
      atob(accessToken.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/") || ""),
    ) as { aal?: string; amr?: Array<{ method?: string } | string> };
  } catch {
    return null;
  }
}

export function accessTokenAal(accessToken: string): string {
  return String(decodeJwtPayload(accessToken)?.aal || "").trim();
}

export function accessTokenHasTotpAmr(accessToken: string): boolean {
  const amr = decodeJwtPayload(accessToken)?.amr;
  if (!Array.isArray(amr)) return false;
  return amr.some((entry) => {
    const method = typeof entry === "string" ? entry : String(entry?.method || "");
    return method === "totp";
  });
}

async function adminUserHasVerifiedTotp(userId: string): Promise<boolean> {
  if (!userId || !isSupabaseAdminConfigured()) return false;
  try {
    const admin = createAdminClient();
    const { data: listed } = await admin.auth.admin.mfa.listFactors({ userId });
    const listedFactors = normalizeMfaFactors(listed?.factors ?? listed);
    if (userHasVerifiedTotp(listedFactors)) return true;
    const { data } = await admin.auth.admin.getUserById(userId);
    return userHasVerifiedTotp(normalizeMfaFactors(data.user?.factors));
  } catch {
    return false;
  }
}

export async function userHasEnrolledTotp(
  user: { id?: string; factors?: MfaFactor[] | null } | null | undefined,
): Promise<boolean> {
  if (!user?.id) return false;
  if (userHasVerifiedTotp(normalizeMfaFactors(user.factors))) return true;
  return adminUserHasVerifiedTotp(user.id);
}

export async function accessTokenNeedsTotpChallenge(
  user: { id?: string; factors?: MfaFactor[] | null } | null | undefined,
  accessToken: string,
): Promise<boolean> {
  if (!user?.id || !accessToken) return false;
  if (accessTokenHasTotpAmr(accessToken) && accessTokenAal(accessToken) === "aal2") {
    return false;
  }
  return userHasEnrolledTotp(user);
}

export async function getMfaGate(supabase: MfaClient): Promise<MfaGate> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return "ok";

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const jwt = session?.access_token;
  if (!jwt) return "ok";

  const hasTotpAmr = accessTokenHasTotpAmr(jwt);
  const jwtAal = accessTokenAal(jwt);
  if (hasTotpAmr && jwtAal === "aal2") return "ok";

  const aalFn = supabase.auth.mfa?.getAuthenticatorAssuranceLevel;
  if (typeof aalFn === "function") {
    const { data: aal } = await aalFn(jwt);
    if (aal) {
      const current = String(aal.currentLevel || "").trim();
      const next = String(aal.nextLevel || "").trim();
      if (current === "aal2" || hasTotpAmr) return "ok";
      if (next === "aal2") return "verify";
      if (next === "aal1" && !(await userHasEnrolledTotp(user))) {
        return "enroll";
      }
    }
  }

  if (!(await userHasEnrolledTotp(user))) return "enroll";
  if (hasTotpAmr && jwtAal === "aal2") return "ok";
  return "verify";
}
