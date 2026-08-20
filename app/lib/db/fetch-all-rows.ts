export const POSTGREST_PAGE_SIZE = 1000;

type QueryPage = {
  data: unknown;
  error: unknown;
};

/** PostgREST pages are untyped; callers treat rows as their table shape. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchAllRows<T = any>(
  queryPage: (from: number, to: number) => PromiseLike<QueryPage>,
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  for (;;) {
    const { data, error } = await queryPage(from, from + POSTGREST_PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < POSTGREST_PAGE_SIZE) break;
    from += POSTGREST_PAGE_SIZE;
  }

  return rows;
}

/** PostgREST IN() chunks are untyped; callers treat rows as their table shape. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchInChunks<T = any>(
  ids: string[],
  queryChunk: (chunk: string[]) => PromiseLike<QueryPage>,
  chunkSize = 200,
): Promise<T[]> {
  if (ids.length === 0) return [];
  const rows: T[] = [];
  for (let index = 0; index < ids.length; index += chunkSize) {
    const chunk = ids.slice(index, index + chunkSize);
    const { data, error } = await queryChunk(chunk);
    if (error) throw error;
    rows.push(...((data ?? []) as T[]));
  }
  return rows;
}
