import { and, asc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { books, readingLogs, type Book, type ReadingLog } from "@/db/schema";
import type { BookDTO, StatsDTO } from "@/lib/types";
import { dayKey } from "@/lib/utils";

export function serializeBook(b: Book): BookDTO {
  return {
    ...b,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    startedAt: b.startedAt ? b.startedAt.toISOString() : null,
    finishedAt: b.finishedAt ? b.finishedAt.toISOString() : null,
  };
}

export async function listBooks(userId: string): Promise<Book[]> {
  return db
    .select()
    .from(books)
    .where(eq(books.userId, userId))
    .orderBy(asc(books.position), asc(books.createdAt));
}

export async function countBooks(userId: string): Promise<number> {
  const rows = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(books)
    .where(eq(books.userId, userId));
  return rows[0]?.c ?? 0;
}

/**
 * Detailed logs are only needed for the recent windows the UI renders
 * (12-month chart, 26-week heatmap, streak), so bound the row scan.
 * The all-time pages total comes from `sumPagesTracked` instead.
 */
export async function listLogs(userId: string, sinceDays = 500): Promise<ReadingLog[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - sinceDays);
  return db
    .select()
    .from(readingLogs)
    .where(and(eq(readingLogs.userId, userId), gte(readingLogs.day, dayKey(cutoff))));
}

/** All-time pages as a single aggregate — no row transfer. */
export async function sumPagesTracked(userId: string): Promise<number> {
  const rows = await db
    .select({ total: sql<number>`coalesce(sum(${readingLogs.pages}), 0)::int` })
    .from(readingLogs)
    .where(eq(readingLogs.userId, userId));
  return rows[0]?.total ?? 0;
}

export function computeStats(
  userIdBooks: Book[],
  logs: ReadingLog[],
  readingGoal: number,
  pagesTrackedAllTime: number
): StatsDTO {
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();

  const byStatus = { want_to_read: 0, reading: 0, finished: 0, paused: 0 } as Record<
    string,
    number
  >;
  let rated = 0;
  let ratingSum = 0;
  let finishedThisYear = 0;
  let finishedThisMonth = 0;
  const genreCounts = new Map<string, number>();
  const monthlyBooks = new Map<string, number>();

  for (const b of userIdBooks) {
    byStatus[b.status] = (byStatus[b.status] ?? 0) + 1;
    genreCounts.set(b.genre, (genreCounts.get(b.genre) ?? 0) + 1);
    if (b.rating > 0) {
      rated += 1;
      ratingSum += b.rating;
    }
    if (b.status === "finished" && b.finishedAt) {
      const f = new Date(b.finishedAt);
      if (f.getFullYear() === thisYear) {
        finishedThisYear += 1;
        if (f.getMonth() === thisMonth) finishedThisMonth += 1;
      }
      const key = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}`;
      monthlyBooks.set(key, (monthlyBooks.get(key) ?? 0) + 1);
    }
  }

  // Pages per day from logs (recent window only).
  const pagesByDay = new Map<string, number>();
  let pagesThisYear = 0;
  for (const log of logs) {
    pagesByDay.set(log.day, (pagesByDay.get(log.day) ?? 0) + log.pages);
    if (Number(log.day.slice(0, 4)) === thisYear) pagesThisYear += log.pages;
  }

  // Last 12 months buckets.
  const monthly: StatsDTO["monthly"] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(thisYear, now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    let pages = 0;
    for (const [day, p] of pagesByDay) {
      if (day.startsWith(key)) pages += p;
    }
    monthly.push({
      label: d.toLocaleString("en-US", { month: "short" }),
      books: monthlyBooks.get(key) ?? 0,
      pages,
    });
  }

  // Reading streak of consecutive days ending today/yesterday.
  let streak = 0;
  const cursor = new Date();
  if (!pagesByDay.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (pagesByDay.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Heatmap: last 26 weeks (182 days).
  const heatmap: StatsDTO["heatmap"] = [];
  for (let i = 181; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    heatmap.push({ day: key, pages: pagesByDay.get(key) ?? 0 });
  }

  const genres = [...genreCounts.entries()]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);

  return {
    total: userIdBooks.length,
    reading: byStatus.reading ?? 0,
    finished: byStatus.finished ?? 0,
    want: byStatus.want_to_read ?? 0,
    paused: byStatus.paused ?? 0,
    pagesTracked: pagesTrackedAllTime,
    pagesThisYear,
    finishedThisYear,
    finishedThisMonth,
    readingGoal,
    streak,
    avgRating: rated ? Math.round((ratingSum / rated) * 10) / 10 : 0,
    monthly,
    genres,
    heatmap,
  };
}
