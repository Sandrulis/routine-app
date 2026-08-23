import type { User } from "@supabase/supabase-js";

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

function readAuthProviders(user: User): string[] {
  const providers = new Set<string>();
  const metadataProvider = user.app_metadata?.provider;
  if (typeof metadataProvider === "string" && metadataProvider.trim()) {
    providers.add(metadataProvider.trim());
  }
  const metadataProviders = user.app_metadata?.providers;
  if (Array.isArray(metadataProviders)) {
    for (const provider of metadataProviders) {
      if (typeof provider === "string" && provider.trim()) {
        providers.add(provider.trim());
      }
    }
  }
  for (const identity of user.identities ?? []) {
    if (identity.provider?.trim()) {
      providers.add(identity.provider.trim());
    }
  }
  return [...providers];
}

export function userHasPasswordLogin(user: User | null | undefined): boolean {
  if (!user) return false;
  return readAuthProviders(user).includes("email");
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
