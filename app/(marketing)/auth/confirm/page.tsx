import { AuthSessionFromUrl } from "@/app/components/auth-session-from-url";
import { getSafeRedirectPath } from "@/app/lib/security/safe-redirect-path";

export const dynamic = "force-dynamic";

export default async function AuthConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = getSafeRedirectPath(params.next ?? null);

  return <AuthSessionFromUrl mode="confirm" next={next} />;
}
