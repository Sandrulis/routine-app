import type { User } from "@supabase/supabase-js";

export function isAuthEmailConfirmed(user: User | null | undefined): boolean {
  return Boolean(user?.email_confirmed_at);
}

export function isEmailNotConfirmedAuthError(error: {
  code?: string;
  message?: string;
}): boolean {
  const code = error.code?.toLowerCase() ?? "";
  const message = error.message?.toLowerCase() ?? "";
  return (
    code === "email_not_confirmed" || message.includes("email not confirmed")
  );
}
