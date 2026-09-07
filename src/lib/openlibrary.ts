import { unstable_cache } from "next/cache";

export type BookSearchResult = {
  key: string;
  title: string;
  author: string;
  coverUrl: string | null;
  firstPublishYear: number | null;
  pages: number | null;
  isbn: string | null;
};

type OLSearchDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  number_of_pages_median?: number;
  isbn?: string[];
};

export function coverUrlFromId(coverId: number, size: "S" | "M" | "L" = "L"): string {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

/**
 * Open Library round-trips take several seconds, so repeat searches are
 * cached server-side for an hour (keyed on query text by unstable_cache).
 */
const cachedSearch = unstable_cache(
  async (query: string, limit: number): Promise<BookSearchResult[]> => {
    const url =
      "https://openlibrary.org/search.json?q=" +
      encodeURIComponent(query) +
      `&limit=${limit}&fields=key,title,author_name,cover_i,first_publish_year,number_of_pages_median,isbn`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Open Library responded ${res.status}`);
    const data = (await res.json()) as { docs?: OLSearchDoc[] };
    return (data.docs ?? [])
      .filter((d) => d.title)
      .map((d) => ({
        key: d.key ?? "",
        title: d.title ?? "Untitled",
        author: d.author_name?.[0] ?? "Unknown author",
        coverUrl: d.cover_i ? coverUrlFromId(d.cover_i, "L") : null,
        firstPublishYear: d.first_publish_year ?? null,
        pages: d.number_of_pages_median ?? null,
        isbn: d.isbn?.[0] ?? null,
      }));
  },
  ["open-library-search"],
  { revalidate: 3600 }
);

export async function searchBooks(query: string, limit = 8): Promise<BookSearchResult[]> {
  return cachedSearch(query.trim().toLowerCase(), limit);
}

/** Resolve a single title to its best cover art — used by the seeder. */
export async function resolveCover(
  title: string,
  author: string
): Promise<{ coverUrl: string | null; key: string | null; isbn: string | null }> {
  const queries = [
    `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=4&fields=key,cover_i,isbn`,
    `https://openlibrary.org/search.json?q=${encodeURIComponent(`${title} ${author}`)}&limit=4&fields=key,cover_i,isbn`,
  ];
  for (const url of queries) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const data = (await res.json()) as { docs?: OLSearchDoc[] };
      const withCover = (data.docs ?? []).find((d) => d.cover_i);
      if (!withCover?.cover_i) continue;
      return {
        coverUrl: coverUrlFromId(withCover.cover_i, "L"),
        key: withCover.key ?? null,
        isbn: withCover.isbn?.[0] ?? null,
      };
    } catch {
      // try the next query shape
    }
  }
  return { coverUrl: null, key: null, isbn: null };
}
