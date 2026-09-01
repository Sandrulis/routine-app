export type MfaGate = "ok" | "enroll" | "verify";

type MfaFactor = {
  status: string;
  factor_type?: string;
};

type MfaClient = {
  auth: {
    getUser: () => Promise<{
      data: { user: { factors?: MfaFactor[] | null } | null };
    }>;
    getSession: () => Promise<{
      data: { session: { access_token: string } | null };
    }>;
    mfa: {
      getAuthenticatorAssuranceLevel: (jwt?: string) => Promise<{
        data: { currentLevel?: string | null } | null;
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

  if (!userHasVerifiedTotp(user.factors as MfaFactor[] | null)) return "enroll";
  return "verify";
}
