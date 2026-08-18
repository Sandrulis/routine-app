type Translate = (
  key: string,
  fallback: string,
  params?: Record<string, string | number>,
) => string;

export function translateActionError(t: Translate, error: string): string {
  return t(error, error);
}
