export const DOCUMENT_TITLE_SEPARATOR = " | ";
export const DEFAULT_SYSTEM_NAME = "Routine";
export const SYSTEM_NAME_PARAM = "SYSTEM_NAME";

export function resolveSystemName(
  systemName: string | null | undefined,
  fallback = DEFAULT_SYSTEM_NAME,
): string {
  return systemName?.trim() || fallback;
}

export function formatDocumentTitle(
  pageTitle: string | null | undefined,
  systemName: string,
): string {
  const page = pageTitle?.trim() ?? "";
  const brand = systemName.trim();
  if (!page) return brand;
  if (!brand || page === brand) return page;
  return `${page}${DOCUMENT_TITLE_SEPARATOR}${brand}`;
}

export function documentTitleTemplate(systemName: string): string {
  return `%s${DOCUMENT_TITLE_SEPARATOR}${systemName.trim()}`;
}
