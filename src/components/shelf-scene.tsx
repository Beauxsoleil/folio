"use client";

import { useMemo } from "react";
import type { BookDTO } from "@/lib/types";
import { clamp, cx, seededUnit } from "@/lib/utils";
import { BookCover } from "@/components/book-cover";

export type ShelfBook = Pick<BookDTO, "id" | "title" | "author" | "coverUrl" | "totalPages">;

const CSS_DIM = /^[0-9.%a-z-]+$/i;

/** A single hardcover rendered as a CSS-3D box, wrapped in its official art. */
export function Book3D({
  book,
  onClick,
  mode = "spine",
  height = 208,
  lean = 0,
}: {
  book: ShelfBook;
  onClick?: (book: ShelfBook) => void;
  mode?: "spine" | "cover";
  height?: number;
  lean?: number; // degrees of resting tilt for organic shelves
}) {
  const unit = useMemo(() => seededUnit(book.id + book.title), [book.id, book.title]);
  const h = Math.round(height * (0.92 + unit * 0.16));
  const w = Math.round(h * 0.66);
  const d = clamp(Math.round((book.totalPages ?? 320) / 11), 16, 60);
  const restTilt = mode === "spine" ? lean : 0;
  const spineFontSafe = book.title.replace(/[^\x20-\x7E]/g, "");

  return (
    <div
      className={cx("group relative shrink-0", mode === "spine" ? "px-[1px]" : "px-2")}
      style={{ perspective: "1400px", width: mode === "spine" ? d + 3 : w + 16 }}
    >
      <button
        type="button"
        data-mode={mode}
        aria-label={`${book.title} by ${book.author}`}
        onClick={() => onClick?.(book)}
        className="book3d"
        style={
          {
            "--w": `${w}px`,
            "--h": `${h}px`,
            "--d": `${d}px`,
            ...(restTilt ? { rotate: `${restTilt}deg` } : {}),
          } as React.CSSProperties
        }
      >
        <span className="bface bface-back" aria-hidden />
        <span className="bface bface-edge" aria-hidden />
        <span className="bface bface-top" aria-hidden />
        <span
          className="bface bface-spine"
          aria-hidden
          style={book.coverUrl && CSS_DIM ? { backgroundImage: `url("${book.coverUrl}")` } : undefined}
        >
          {!book.coverUrl && (
            <span
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg, #4a382b, #2b2018)`,
              }}
            />
          )}
          <span className="spine-title">
            <span className="overflow-hidden text-ellipsis">{spineFontSafe}</span>
          </span>
        </span>
        <span className="bface bface-front">
          <BookCover
            title={book.title}
            author={book.author}
            coverUrl={book.coverUrl}
            className="absolute inset-0 h-full w-full"
            sizes="220px"
          />
        </span>
      </button>
      <span
        aria-hidden
        className="book3d-shadow pointer-events-none absolute -bottom-[1px] left-1/2 h-[6px] w-[86%] -translate-x-1/2 rounded-full bg-black/70 blur-[5px]"
      />
    </div>
  );
}

/** One wooden shelf: back wall, row of books, plank with engraved plate. */
export function Shelf({
  label,
  books,
  onSelect,
  mode = "spine",
  bookHeight = 208,
  emptyHint,
}: {
  label?: string;
  books: ShelfBook[];
  onSelect?: (book: ShelfBook) => void;
  mode?: "spine" | "cover";
  bookHeight?: number;
  emptyHint?: string;
}) {
  const leans = useMemo(
    () =>
      books.length <= 1
        ? [0]
        : books.map((b, i) => {
            if (i === books.length - 1 && books.length % 3 === 0) return -6;
            if (i % 4 === 2 && i < books.length - 1) return 0;
            return 0;
          }),
    [books]
  );

  return (
    <div className="relative">
      <div className="flex items-end justify-between px-5 pb-1.5">
        {label && (
          <span className="font-display text-[13px] font-medium italic tracking-wide text-cream-400">
            {label}
          </span>
        )}
        <span className="text-[11px] font-medium tabular-nums tracking-wide text-cream-600">
          {books.length} {books.length === 1 ? "volume" : "volumes"}
        </span>
      </div>

      <div className="shelf-room relative overflow-hidden rounded-lg border border-ink-700/80">
        {/* bookcase side walls */}
        <div className="shelf-side absolute inset-y-0 left-0 w-[10px]" aria-hidden />
        <div className="shelf-side absolute inset-y-0 right-0 w-[10px]" aria-hidden />

        <div className="relative flex min-h-[150px] items-end gap-0 overflow-x-auto px-[26px] pt-8 [perspective:1600px]">
          {books.length === 0 ? (
            <div className="flex h-[150px] w-full items-end gap-[6px] pb-0">
              {[0.85, 1, 0.92, 0.78, 0.95].map((u, i) => (
                <div
                  key={i}
                  className="ghost-book hidden first:block sm:block"
                  style={{ width: 26 - i * 2, height: 148 * u, borderRadius: 2 }}
                />
              ))}
              <div className="flex flex-1 items-center justify-center self-stretch pb-6 pl-4">
                <p className="text-center text-[12.5px] italic text-cream-500">
                  {emptyHint ?? "An empty shelf, waiting for its first story…"}
                </p>
              </div>
            </div>
          ) : (
            books.map((b, i) => (
              <Book3D
                key={b.id}
                book={b}
                mode={mode}
                height={bookHeight}
                lean={leans[i]}
                onClick={onSelect}
              />
            ))
          )}
        </div>

        <div className="relative mx-[10px]">
          <div className="shelf-plank" />
        </div>
        <div className="h-4" />
      </div>
    </div>
  );
}

/** A stack of shelves. */
export function ShelfScene({
  shelves,
  onSelect,
  mode = "spine",
  bookHeight = 208,
}: {
  shelves: Array<{ key: string; label?: string; books: ShelfBook[]; emptyHint?: string }>;
  onSelect?: (book: ShelfBook) => void;
  mode?: "spine" | "cover";
  bookHeight?: number;
}) {
  return (
    <div className="flex flex-col gap-9">
      {shelves.map((s) => (
        <Shelf
          key={s.key}
          label={s.label}
          books={s.books}
          onSelect={onSelect}
          mode={mode}
          bookHeight={bookHeight}
          emptyHint={s.emptyHint}
        />
      ))}
    </div>
  );
}
