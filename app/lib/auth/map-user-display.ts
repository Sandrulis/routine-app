import type { User } from "@supabase/supabase-js";
import { resolveDisplayName } from "@/app/lib/users/display-name";

export type UserDisplay = {
  name: string;
  email: string;
  avatarUrl: string | null;
};

function readString(metadata: Record<string, unknown>, key: string): string {
  const value = metadata[key];
  return typeof value === "string" ? value.trim() : "";
}

function metadataSources(user: User): Record<string, unknown>[] {
  const sources: Record<string, unknown>[] = [
    (user.user_metadata ?? {}) as Record<string, unknown>,
  ];

  for (const identity of user.identities ?? []) {
    sources.push((identity.identity_data ?? {}) as Record<string, unknown>);
  }

  return sources;
}

function readName(metadata: Record<string, unknown>): string {
  const given = readString(metadata, "given_name");
  const family = readString(metadata, "family_name");
  if (given || family) {
    return [given, family].filter(Boolean).join(" ");
  }

  return (
    readString(metadata, "full_name") ||
    readString(metadata, "name")
  );
}

export function readAvatarUrl(metadata: Record<string, unknown>): string | null {
  return (
    readString(metadata, "avatar_url") ||
    readString(metadata, "picture") ||
    null
  );
}

export function resolveAvatarUrl(user: User): string | null {
  for (const metadata of metadataSources(user)) {
    const url = readAvatarUrl(metadata);
    if (url) return url;
  }

  return null;
}

const OAUTH_PROVIDERS = new Set(["google", "microsoft"]);

function addAuthProvider(target: Set<string>, value: unknown) {
  const provider = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (provider) target.add(provider);
}

function listUserAuthProviders(user: User): string[] {
  const providers = new Set<string>();
  addAuthProvider(providers, user.app_metadata?.provider);
  if (Array.isArray(user.app_metadata?.providers)) {
    for (const provider of user.app_metadata.providers) {
      addAuthProvider(providers, provider);
    }
  }
  for (const identity of user.identities ?? []) {
    addAuthProvider(providers, identity.provider);
  }
  addAuthProvider(
    providers,
    (user.user_metadata as Record<string, unknown> | undefined)?.provider,
  );
  return [...providers];
}

function userHasOauthLogin(user: User): boolean {
  return listUserAuthProviders(user).some((provider) =>
    OAUTH_PROVIDERS.has(provider),
  );
}

export function userHasPasswordLogin(user: User | null | undefined): boolean {
  if (!user) return false;
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  if (metadata.password_set === true) return true;
  // Google/Microsoft accounts are created with a random password and an email
  // identity. That is not a password the user knows.
  if (userHasOauthLogin(user)) return false;
  return (
    listUserAuthProviders(user).includes("email") || Boolean(user.email?.trim())
  );
}

export function userCanManagePassword(user: User | null | undefined): boolean {
  if (!user) return false;
  return Boolean(user.email?.trim());
}

export function mapUserDisplay(user: User): UserDisplay {
  let name = "";
  for (const metadata of metadataSources(user)) {
    name = readName(metadata);
    if (name) break;
  }

  if (!name) {
    name = user.email?.split("@")[0] || "";
  }

  return {
    name,
    email: user.email?.trim() || "",
    avatarUrl: resolveAvatarUrl(user),
  };
}

export function resolveUserDisplayName(
  user: User,
  storedName?: string | null,
): string {
  const display = mapUserDisplay(user);
  return resolveDisplayName({
    authName: display.name,
    email: display.email || user.email?.trim() || "",
    storedName,
  });
}
