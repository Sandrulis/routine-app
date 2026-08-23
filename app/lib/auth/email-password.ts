import { createAdminClient } from "@/app/lib/supabase/admin";
import {
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from "@/app/lib/supabase/env";
import { getResendCredentials } from "@/app/lib/integrations/resend/client";
import { sendSignupConfirmation, sendPasswordResetEmail } from "@/app/lib/email/send-auth-emails";
import {
  authConfirmRedirectUrl,
  resolveAuthEmailLink,
} from "@/app/lib/auth/auth-confirm-link";
import { findAuthUserByEmailExact } from "@/app/lib/auth/find-auth-user-by-email";
import { joinDisplayName } from "@/app/lib/users/display-name";
import { logError } from "@/app/lib/security/log-error";
import { getSafeRedirectPath } from "@/app/lib/security/safe-redirect-path";

function isAlreadyRegisteredError(error: {
  message?: string;
  code?: string;
}): boolean {
  const code = error.code?.toLowerCase() ?? "";
  const message = error.message?.toLowerCase() ?? "";
  return (
    code === "email_exists" ||
    code === "user_already_exists" ||
    message.includes("already") ||
    message.includes("registered") ||
    message.includes("exists")
  );
}

function buildSignupMetadata(firstName: string, lastName: string) {
  const fullName = joinDisplayName(firstName, lastName);
  return {
    given_name: firstName,
    family_name: lastName,
    name: fullName,
    full_name: fullName,
  };
}

async function sendSignupLink(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  next: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const redirectTo = authConfirmRedirectUrl(next);
  const metadata = buildSignupMetadata(firstName, lastName);
  const generated = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: {
      data: metadata,
      redirectTo,
    },
  });

  let confirmLink = resolveAuthEmailLink(generated.data?.properties, {
    type: "signup",
    next,
  });

  if (generated.error || !confirmLink) {
    if (generated.error && isAlreadyRegisteredError(generated.error)) {
      const existing = await findAuthUserByEmailExact(email);
      if (existing?.emailConfirmed) {
        return { ok: true };
      }

      if (existing && !existing.emailConfirmed) {
        const { error: updateError } = await admin.auth.admin.updateUserById(
          existing.id,
          {
            password,
            user_metadata: metadata,
          },
        );
        if (updateError) {
          logError("updateUserById signup metadata failed", updateError.message);
        }

        const invite = await admin.auth.admin.generateLink({
          type: "invite",
          email,
          options: { redirectTo },
        });
        confirmLink = resolveAuthEmailLink(invite.data?.properties, {
          type: "invite",
          next,
        });
        if (invite.error || !confirmLink) {
          logError(
            "generateLink invite failed",
            invite.error?.message ?? "missing link",
          );
          return { ok: false, error: "errors.auth_email_send_failed" };
        }
      } else {
        logError(
          "generateLink signup failed",
          generated.error?.message ?? "missing link",
        );
        return { ok: false, error: "errors.auth_email_send_failed" };
      }
    } else {
      logError(
        "generateLink signup failed",
        generated.error?.message ?? "missing link",
      );
      return { ok: false, error: "errors.auth_email_send_failed" };
    }
  }

  return sendSignupConfirmation({
    email,
    confirmLink,
    name: metadata.name,
  });
}

export async function registerWithEmailPassword(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  next?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await getResendCredentials())) {
    return { ok: false, error: "errors.auth_email_disabled" };
  }
  if (!isSupabaseAdminConfigured() || !isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  if (!firstName || !lastName) {
    return { ok: false, error: "errors.auth_invalid" };
  }

  const existing = await findAuthUserByEmailExact(input.email);
  if (existing?.emailConfirmed) {
    return { ok: true };
  }

  return sendSignupLink(
    input.email,
    input.password,
    firstName,
    lastName,
    getSafeRedirectPath(input.next),
  );
}

export async function requestPasswordResetEmail(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await getResendCredentials())) {
    return { ok: false, error: "errors.auth_email_disabled" };
  }
  if (!isSupabaseAdminConfigured() || !isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const existing = await findAuthUserByEmailExact(email);
  if (!existing?.emailConfirmed) {
    return { ok: true };
  }

  const admin = createAdminClient();
  const redirectTo = authConfirmRedirectUrl("/update-password");
  const generated = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });

  const resetLink = resolveAuthEmailLink(generated.data?.properties, {
    type: "recovery",
    next: "/update-password",
  });
  if (generated.error || !resetLink) {
    logError(
      "generateLink recovery failed",
      generated.error?.message ?? "missing link",
    );
    return { ok: false, error: "errors.auth_password_reset_failed" };
  }

  const sent = await sendPasswordResetEmail({
    email,
    resetLink,
  });
  if (!sent.ok) {
    return { ok: false, error: "errors.auth_password_reset_failed" };
  }
  return { ok: true };
}
