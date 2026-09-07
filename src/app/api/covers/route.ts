import { getCurrentUser } from "@/lib/auth";
import { searchBooks } from "@/lib/openlibrary";

export const dynamic = "force-dynamic";

/** Proxies Open Library search so live official cover art stays server-verified. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return Response.json({ results: [] });
  try {
    const results = await searchBooks(q, 8);
    return Response.json({ results });
  } catch (error) {
    console.error("cover search failed", error);
    return Response.json({ results: [], error: "Search unavailable" }, { status: 502 });
  }
}
