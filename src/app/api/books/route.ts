import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { books, BOOK_STATUSES } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { listBooks } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await listBooks(user.id);
  return Response.json({ books: rows });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  const author = String(body.author ?? "").trim() || "Unknown author";
  if (!title) return Response.json({ error: "Title is required." }, { status: 400 });

  const status = BOOK_STATUSES.includes(body.status) ? body.status : "want_to_read";
  const totalPages = Number.isFinite(+body.totalPages) && +body.totalPages > 0 ? Math.round(+body.totalPages) : null;
  const currentPage = Math.max(0, Math.min(totalPages ?? 0, Math.round(+body.currentPage || 0)));

  const [{ maxPos }] = await db
    .select({ maxPos: sql<number>`coalesce(max(${books.position}), 0)` })
    .from(books)
    .where(eq(books.userId, user.id));

  const now = new Date();
  const [book] = await db
    .insert(books)
    .values({
      userId: user.id,
      title: title.slice(0, 300),
      author: author.slice(0, 200),
      isbn: body.isbn ? String(body.isbn).slice(0, 20) : null,
      coverUrl: body.coverUrl ? String(body.coverUrl).slice(0, 500) : null,
      openLibraryKey: body.openLibraryKey ? String(body.openLibraryKey) : null,
      status,
      genre: String(body.genre ?? "General").slice(0, 60) || "General",
      totalPages,
      currentPage: status === "finished" ? (totalPages ?? 0) : currentPage,
      rating: Math.max(0, Math.min(5, Math.round(+body.rating || 0))),
      notes: body.notes ? String(body.notes) : null,
      startedAt: status !== "want_to_read" ? now : null,
      finishedAt: status === "finished" ? now : null,
      position: (maxPos ?? 0) + 1,
    })
    .returning();

  return Response.json({ book }, { status: 201 });
}
