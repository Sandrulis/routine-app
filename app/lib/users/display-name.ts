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
