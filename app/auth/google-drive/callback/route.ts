import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import {
  GOOGLE_DRIVE_OAUTH_COOKIE,
  GOOGLE_DRIVE_PAGE_PATH,
} from "@/app/lib/google-drive/env";
import {
  exchangeGoogleDriveCode,
  fetchGoogleDriveAccountEmail,
  googleDriveOAuthCookieOptions,
  parseGoogleDriveOAuthState,
} from "@/app/lib/google-drive/oauth";
import {
  assertCanConfigureGoogleDrive,
  saveGoogleDriveTokens,
} from "@/app/lib/google-drive/repository";

function redirectToDrivePage(origin: string, query: Record<string, string>) {
  const url = new URL(GOOGLE_DRIVE_PAGE_PATH, origin);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

function clearOAuthCookie(response: NextResponse) {
  response.cookies.set(GOOGLE_DRIVE_OAUTH_COOKIE, "", {
    ...googleDriveOAuthCookieOptions(0),
    maxAge: 0,
  });
  return response;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const cookieStore = await cookies();
  const cookieState = parseGoogleDriveOAuthState(
    cookieStore.get(GOOGLE_DRIVE_OAUTH_COOKIE)?.value,
  );
  const urlState = parseGoogleDriveOAuthState(stateParam);

  if (
    !code ||
    !cookieState ||
    !urlState ||
    cookieState.teamId !== urlState.teamId ||
    cookieState.nonce !== urlState.nonce
  ) {
    return clearOAuthCookie(
      redirectToDrivePage(origin, { error: "oauth" }),
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return clearOAuthCookie(
      redirectToDrivePage(origin, { error: "oauth" }),
    );
  }

  const allowed = await assertCanConfigureGoogleDrive(cookieState.teamId, user.id);
  if (!allowed.ok) {
    return clearOAuthCookie(
      redirectToDrivePage(origin, { error: "forbidden" }),
    );
  }

  const tokens = await exchangeGoogleDriveCode(origin, code);
  if (!tokens?.access_token) {
    return clearOAuthCookie(
      redirectToDrivePage(origin, { error: "oauth" }),
    );
  }

  const accountEmail = await fetchGoogleDriveAccountEmail(tokens.access_token);
  const saved = await saveGoogleDriveTokens({
    teamId: cookieState.teamId,
    refreshToken: tokens.refresh_token ?? "",
    accessToken: tokens.access_token,
    expiresIn: Number(tokens.expires_in ?? 3600),
    accountEmail,
    connectedBy: user.id,
  });

  return clearOAuthCookie(
    redirectToDrivePage(
      origin,
      saved.ok ? { connected: "1" } : { error: "oauth" },
    ),
  );
}
