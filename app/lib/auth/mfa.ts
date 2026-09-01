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
    mfa: {
      getAuthenticatorAssuranceLevel: (jwt?: string) => Promise<{
        data: {
          currentLevel?: string | null;
          nextLevel?: string | null;
        } | null;
      }>;
      listFactors: () => Promise<{
        data: { totp?: Array<{ status: string }> | null } | null;
      }>;
    };
  };
};

export function userHasVerifiedTotp(factors?: MfaFactor[] | null): boolean {
  return (factors ?? []).some(
    (factor) => factor.status === "verified" && factor.factor_type === "totp",
  );
}

export function accessTokenAal(accessToken: string): string {
  try {
    const payload = JSON.parse(
      atob(accessToken.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/") || ""),
    ) as { aal?: string };
    return String(payload.aal || "").trim();
  } catch {
    return "";
  }
}

async function adminUserHasVerifiedTotp(userId: string): Promise<boolean> {
  if (!userId || !isSupabaseAdminConfigured()) return false;
  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.getUserById(userId);
    return userHasVerifiedTotp(data.user?.factors);
  } catch {
    return false;
  }
}

async function clientHasVerifiedTotp(
  supabase: MfaClient,
  user: { id: string; factors?: MfaFactor[] | null },
): Promise<boolean> {
  if (userHasVerifiedTotp(user.factors)) return true;
  try {
    const { data } = await supabase.auth.mfa.listFactors();
    if ((data?.totp ?? []).some((factor) => factor.status === "verified")) {
      return true;
    }
    return false;
  } catch {
    return adminUserHasVerifiedTotp(user.id);
  }
}

export async function accessTokenNeedsTotpChallenge(
  user: { id?: string; factors?: MfaFactor[] | null } | null | undefined,
  accessToken: string,
): Promise<boolean> {
  if (!user?.id || !accessToken) return false;
  if (accessTokenAal(accessToken) === "aal2") return false;
  if (userHasVerifiedTotp(user.factors)) return true;
  return adminUserHasVerifiedTotp(user.id);
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

  // Pass the JWT so auth-js calls getUser(jwt) instead of reading session.user.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel(jwt);
  if (aal?.currentLevel === "aal2") return "ok";
  if (aal?.nextLevel === "aal2") return "verify";

  if (await clientHasVerifiedTotp(supabase, user)) return "verify";
  return "enroll";
}
