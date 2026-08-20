export type MfaGate = "ok" | "enroll" | "verify";

type MfaClient = {
  auth: {
    mfa: {
      getAuthenticatorAssuranceLevel: () => Promise<{
        data: { currentLevel?: string | null } | null;
      }>;
      listFactors: () => Promise<{
        data: { totp?: Array<{ status: string }> } | null;
      }>;
    };
  };
};

export async function getMfaGate(supabase: MfaClient): Promise<MfaGate> {
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal2") return "ok";

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const verified = (factors?.totp ?? []).filter(
    (factor) => factor.status === "verified",
  );
  if (verified.length === 0) return "enroll";
  return "verify";
}
