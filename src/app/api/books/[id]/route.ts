import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { books, readingLogs, BOOK_STATUSES } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { dayKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function getOwnedBook(userId: string, id: string) {
  const rows = await db
    .select()
    .from(books)
    .where(and(eq(books.id, id), eq(books.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function GET(_req: Request, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const book = await getOwnedBook(user.id, id);
  if (!book) return Response.json({ error: "Book not found." }, { status: 404 });
  return Response.json({ book });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const book = await getOwnedBook(user.id, id);
  if (!book) return Response.json({ error: "Book not found." }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const patch: Partial<typeof books.$inferInsert> = { updatedAt: new Date() };
  const now = new Date();

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) return Response.json({ error: "Title cannot be empty." }, { status: 400 });
    patch.title = title.slice(0, 300);
  }
  if (body.author !== undefined) patch.author = String(body.author).trim().slice(0, 200) || "Unknown author";
  if (body.genre !== undefined) patch.genre = String(body.genre).trim().slice(0, 60) || "General";
  if (body.coverUrl !== undefined) patch.coverUrl = body.coverUrl ? String(body.coverUrl).slice(0, 500) : null;
  if (body.notes !== undefined) patch.notes = body.notes ? String(body.notes) : null;
  if (body.rating !== undefined) patch.rating = Math.max(0, Math.min(5, Math.round(+body.rating || 0)));

  let totalPages = book.totalPages;
  if (body.totalPages !== undefined) {
    totalPages = Number.isFinite(+body.totalPages) && +body.totalPages > 0 ? Math.round(+body.totalPages) : null;
    patch.totalPages = totalPages;
  }

  let pageDelta = 0;
  if (body.currentPage !== undefined) {
    const next = Math.max(0, Math.min(totalPages ?? Number.MAX_SAFE_INTEGER, Math.round(+body.currentPage || 0)));
    pageDelta = next - book.currentPage;
    patch.currentPage = next;
  }

  if (body.status !== undefined && BOOK_STATUSES.includes(body.status)) {
    const next = body.status as (typeof BOOK_STATUSES)[number];
    const prev = book.status;
    patch.status = next;
    if (next === "reading" && prev === "want_to_read" && !book.startedAt) patch.startedAt = now;
    if (next === "reading" && prev === "finished") patch.finishedAt = null;
    if (next === "finished") {
      patch.finishedAt = now;
      patch.startedAt = book.startedAt ?? now;
      if (totalPages && (book.currentPage ?? 0) < totalPages) {
        pageDelta = totalPages - (patch.currentPage ?? book.currentPage ?? 0);
        if (pageDelta < 0) pageDelta = 0;
        patch.currentPage = totalPages;
      }
    }
    if (next === "want_to_read") {
      patch.currentPage = 0;
      patch.startedAt = null;
      patch.finishedAt = null;
    }
  }

  // The book update and the page-log insert are independent — run together.
  const [[updated]] = await Promise.all([
    db.update(books).set(patch).where(eq(books.id, book.id)).returning(),
    pageDelta > 0
      ? db.insert(readingLogs).values({
          userId: user.id,
          bookId: book.id,
          day: dayKey(now),
          pages: pageDelta,
        })
      : Promise.resolve(null),
  ]);

  return Response.json({ book: updated });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const book = await getOwnedBook(user.id, id);
  if (!book) return Response.json({ error: "Book not found." }, { status: 404 });
  await db.delete(books).where(eq(books.id, book.id));
  // Compact positions so the shelf order stays tidy.
  await db.execute(sql`
    UPDATE books SET position = sub.pos FROM (
      SELECT id, row_number() OVER (ORDER BY position, created_at) AS pos
      FROM books WHERE user_id = ${user.id}
    ) AS sub WHERE books.id = sub.id
  `);
  return Response.json({ ok: true });
}
