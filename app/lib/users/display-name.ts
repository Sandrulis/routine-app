export function emailLocalPart(email: string): string {
  return email.trim().split("@")[0] ?? "";
}

export function isEmailPlaceholderDisplayName(name: string, email: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return true;

  const normalizedEmail = email.trim().toLowerCase();
  const local = emailLocalPart(normalizedEmail);
  const normalizedName = trimmed.toLowerCase();

  return (
    (local.length > 0 && normalizedName === local) ||
    (normalizedEmail.length > 0 && normalizedName === normalizedEmail)
  );
}

export function resolveDisplayName(input: {
  authName: string;
  email: string;
  storedName?: string | null;
}): string {
  const stored = input.storedName?.trim() ?? "";
  const auth = input.authName.trim();
  const email = input.email.trim();

  if (stored && isEmailPlaceholderDisplayName(auth, email)) {
    return stored;
  }
  if (auth && !isEmailPlaceholderDisplayName(auth, email)) {
    return auth;
  }
  return stored || auth || emailLocalPart(email);
}

export function splitDisplayName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { firstName: "", lastName: "" };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export function joinDisplayName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}

export function readPersonalNameFromMetadata(
  metadata: Record<string, unknown> | undefined,
  fallbackName: string,
): { firstName: string; lastName: string } {
  const given =
    typeof metadata?.given_name === "string" ? metadata.given_name.trim() : "";
  const family =
    typeof metadata?.family_name === "string" ? metadata.family_name.trim() : "";

  if (given || family) {
    return { firstName: given, lastName: family };
  }

  return splitDisplayName(fallbackName);
}
