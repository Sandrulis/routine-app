export const ACCOUNT_DELETION_REACTIVATED_COOKIE = "account_deletion_reactivated";

export function applyAccountDeletionReactivatedCookie(response: {
  cookies: { set: (name: string, value: string, options?: { path?: string; maxAge?: number }) => void };
}) {
  response.cookies.set(ACCOUNT_DELETION_REACTIVATED_COOKIE, "1", {
    path: "/",
    maxAge: 60,
  });
}
