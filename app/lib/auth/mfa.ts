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
  };
};

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
    if (userHasVerifiedTotp(listed?.factors)) return true;
    const { data } = await admin.auth.admin.getUserById(userId);
    return userHasVerifiedTotp(data.user?.factors);
  } catch {
    return false;
  }
}

export async function userHasEnrolledTotp(
  user: { id?: string; factors?: MfaFactor[] | null } | null | undefined,
): Promise<boolean> {
  if (!user?.id) return false;
  if (userHasVerifiedTotp(user.factors)) return true;
  return adminUserHasVerifiedTotp(user.id);
}

export async function accessTokenNeedsTotpChallenge(
  user: { id?: string; factors?: MfaFactor[] | null } | null | undefined,
  accessToken: string,
): Promise<boolean> {
  if (!user?.id || !accessToken) return false;
  if (accessTokenHasTotpAmr(accessToken)) return false;
  return userHasEnrolledTotp(user);
}

export async function getMfaGate(supabase: MfaClient): Promise<MfaGate> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "ok";

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const jwt = session?.access_token;
  if (!jwt) return "ok";

  if (!(await userHasEnrolledTotp(user))) return "enroll";
  if (accessTokenHasTotpAmr(jwt) && accessTokenAal(jwt) === "aal2") return "ok";
  return "verify";
}
