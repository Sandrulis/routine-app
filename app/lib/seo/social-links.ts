/**
 * Public brand profiles emitted as Organization `sameAs` in JSON-LD.
 *
 * Only add profiles that are live and clearly owned by the brand — Google
 * treats `sameAs` as an identity claim, and dead or unrelated links weaken it.
 */
export const SOCIAL_PROFILE_URLS: readonly string[] = [];

export function socialProfileUrls(): string[] {
  return SOCIAL_PROFILE_URLS.filter((url) => /^https:\/\//i.test(url.trim())).map(
    (url) => url.trim(),
  );
}
