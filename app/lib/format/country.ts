export function formatCountryName(
  countryCode: string | null | undefined,
  locale: string,
): string | null {
  const code = countryCode?.trim().toUpperCase() ?? "";
  if (!/^[A-Z]{2}$/.test(code)) return null;
  try {
    const name = new Intl.DisplayNames([locale], { type: "region" }).of(code);
    return name?.trim() || null;
  } catch {
    return null;
  }
}
