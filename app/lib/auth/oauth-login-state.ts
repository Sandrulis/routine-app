import { randomBytes } from "node:crypto";
import { getSafeRedirectPath } from "@/app/lib/security/safe-redirect-path";

export type OAuthLoginErrorPage = "login" | "signup";

export type OAuthLoginState = {
  nonce: string;
  next: string;
  errorPage: OAuthLoginErrorPage;
};

const LOGIN_PREFIX = "login.";

export function createOAuthLoginState(input: {
  next?: string;
  errorPage: OAuthLoginErrorPage;
}): OAuthLoginState {
  return {
    nonce: randomBytes(16).toString("hex"),
    next: getSafeRedirectPath(input.next),
    errorPage: input.errorPage,
  };
}

export function serializeOAuthLoginState(state: OAuthLoginState) {
  return `${LOGIN_PREFIX}${state.nonce}.${encodeURIComponent(state.next)}.${state.errorPage}`;
}

export function parseOAuthLoginState(
  raw: string | null | undefined,
): OAuthLoginState | null {
  if (!raw?.startsWith(LOGIN_PREFIX)) return null;
  const rest = raw.slice(LOGIN_PREFIX.length);
  const firstDot = rest.indexOf(".");
  if (firstDot <= 0) return null;
  const nonce = rest.slice(0, firstDot).trim();
  const remainder = rest.slice(firstDot + 1);
  const lastDot = remainder.lastIndexOf(".");
  if (lastDot <= 0) return null;
  const nextRaw = remainder.slice(0, lastDot);
  const errorPage = remainder.slice(lastDot + 1).trim();
  if (!nonce || (errorPage !== "login" && errorPage !== "signup")) return null;
  let next = "/dashboard";
  try {
    next = getSafeRedirectPath(decodeURIComponent(nextRaw));
  } catch {
    next = "/dashboard";
  }
  return { nonce, next, errorPage };
}

export function oauthLoginStatesMatch(
  left: OAuthLoginState | null,
  right: OAuthLoginState | null,
) {
  return Boolean(
    left &&
      right &&
      left.nonce === right.nonce &&
      left.next === right.next &&
      left.errorPage === right.errorPage,
  );
}
