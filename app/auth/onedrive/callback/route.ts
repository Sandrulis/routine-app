import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import {
  ONEDRIVE_OAUTH_COOKIE,
  ONEDRIVE_PAGE_PATH,
} from "@/app/lib/onedrive/env";
import {
  exchangeOneDriveCode,
  fetchOneDriveAccountEmail,
  oneDriveOAuthCookieOptions,
  parseOneDriveOAuthState,
} from "@/app/lib/onedrive/oauth";
import {
  assertCanConfigureOneDrive,
  saveOneDriveTokens,
} from "@/app/lib/onedrive/repository";

function redirectToOneDrivePage(origin: string, query: Record<string, string>) {
  const url = new URL(ONEDRIVE_PAGE_PATH, origin);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

function clearOAuthCookie(response: NextResponse) {
  response.cookies.set(ONEDRIVE_OAUTH_COOKIE, "", {
    ...oneDriveOAuthCookieOptions(0),
    maxAge: 0,
  });
  return response;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const cookieStore = await cookies();
  const cookieState = parseOneDriveOAuthState(
    cookieStore.get(ONEDRIVE_OAUTH_COOKIE)?.value,
  );
  const urlState = parseOneDriveOAuthState(stateParam);

  if (
    !code ||
    !cookieState ||
    !urlState ||
    cookieState.teamId !== urlState.teamId ||
    cookieState.nonce !== urlState.nonce
  ) {
    return clearOAuthCookie(redirectToOneDrivePage(origin, { error: "oauth" }));
  }

  const user = await getCurrentUser();
  if (!user) {
    return clearOAuthCookie(redirectToOneDrivePage(origin, { error: "oauth" }));
  }

  const allowed = await assertCanConfigureOneDrive(cookieState.teamId, user.id);
  if (!allowed.ok) {
    return clearOAuthCookie(
      redirectToOneDrivePage(origin, { error: "forbidden" }),
    );
  }

  const tokens = await exchangeOneDriveCode(origin, code);
  if (!tokens?.access_token) {
    return clearOAuthCookie(redirectToOneDrivePage(origin, { error: "oauth" }));
  }

  const accountEmail = await fetchOneDriveAccountEmail(tokens.access_token);
  const saved = await saveOneDriveTokens({
    teamId: cookieState.teamId,
    refreshToken: tokens.refresh_token ?? "",
    accessToken: tokens.access_token,
    expiresIn: Number(tokens.expires_in ?? 3600),
    accountEmail,
    connectedBy: user.id,
  });

  return clearOAuthCookie(
    redirectToOneDrivePage(
      origin,
      saved.ok ? { connected: "1" } : { error: "oauth" },
    ),
  );
}
