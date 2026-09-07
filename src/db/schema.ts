import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  readingGoal: integer("reading_goal").notNull().default(24),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const BOOK_STATUSES = ["want_to_read", "reading", "finished", "paused"] as const;
export type BookStatus = (typeof BOOK_STATUSES)[number];

export const books = pgTable(
  "books",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    author: text("author").notNull(),
    isbn: text("isbn"),
    coverUrl: text("cover_url"),
    openLibraryKey: text("open_library_key"),
    status: text("status").notNull().default("want_to_read"),
    rating: integer("rating").notNull().default(0),
    genre: text("genre").notNull().default("General"),
    currentPage: integer("current_page").notNull().default(0),
    totalPages: integer("total_pages"),
    notes: text("notes"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("books_user_idx").on(t.userId, t.position)]
);

export const readingLogs = pgTable(
  "reading_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    day: text("day").notNull(), // YYYY-MM-DD
    pages: integer("pages").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("reading_logs_user_idx").on(t.userId, t.day)]
);

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Book = typeof books.$inferSelect;
export type ReadingLog = typeof readingLogs.$inferSelect;
