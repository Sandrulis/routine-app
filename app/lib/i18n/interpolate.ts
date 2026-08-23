import { SYSTEM_NAME_PARAM } from "@/app/lib/document-title";

export function withSystemNameParams(
  systemName: string,
  params?: Record<string, string | number>,
): Record<string, string | number> {
  return { [SYSTEM_NAME_PARAM]: systemName, ...params };
}

export function interpolate(
  value: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] == null ? `{${key}}` : String(params[key]),
  );
}
