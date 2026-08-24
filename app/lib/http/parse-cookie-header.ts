export type ParsedCookie = { name: string; value: string };

/** Parse a raw `Cookie` request header into name/value pairs. */
export function parseCookieHeader(header: string | null): ParsedCookie[] {
  if (!header) return [];

  return header.split(";").flatMap((part) => {
    const trimmed = part.trim();
    const separator = trimmed.indexOf("=");
    if (separator < 0) return [];

    const rawName = trimmed.slice(0, separator);
    const rawValue = trimmed.slice(separator + 1);
    try {
      return [
        {
          name: decodeURIComponent(rawName),
          value: decodeURIComponent(rawValue),
        },
      ];
    } catch {
      return [{ name: rawName, value: rawValue }];
    }
  });
}
