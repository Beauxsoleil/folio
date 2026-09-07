"use client";

import { useEffect, useState } from "react";
import { CalendarCheck2, CalendarPlus2, Hash, Layers, PencilLine, Trash2 } from "lucide-react";
import type { BookDTO, BookStatus } from "@/lib/types";
import { STATUS_META } from "@/lib/types";
import { cx, formatDate } from "@/lib/utils";
import { Button, Drawer, Field, Stars, Textarea } from "@/components/ui";
import { Book3D } from "@/components/shelf-scene";

export function BookDrawer({
  book,
  onClose,
  onPatch,
  onDelete,
  onEdit,
}: {
  book: BookDTO | null;
  onClose: () => void;
  onPatch: (id: string, patch: Partial<BookDTO>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (book: BookDTO) => void;
}) {
  const [notes, setNotes] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  // A drag in flight keeps the value local; the PATCH is committed once on
  // release instead of firing a request for every pixel the thumb travels.
  const [dragPage, setDragPage] = useState<number | null>(null);

  useEffect(() => {
    setNotes(book?.notes ?? "");
    setConfirmingDelete(false);
    setBusy(false);
    setDragPage(null);
  }, [book?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!book) return <Drawer open={false} onClose={onClose}>{null}</Drawer>;

  const shownPage = dragPage ?? book.currentPage;
  const pct = book.totalPages ? Math.round((shownPage / book.totalPages) * 100) : 0;
  const patch = (p: Partial<BookDTO>) => onPatch(book.id, p);
  const commitPage = () => {
    if (dragPage !== null && dragPage !== book.currentPage) void patch({ currentPage: dragPage });
    setDragPage(null);
  };

  const saveNotes = async () => {
    if ((book.notes ?? "") === notes.trim()) return;
    await patch({ notes: notes.trim() || null });
  };

  const doDelete = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      setTimeout(() => setConfirmingDelete(false), 3200);
      return;
    }
    setBusy(true);
    await onDelete(book.id);
    setBusy(false);
  };

  return (
    <Drawer open={!!book} onClose={onClose}>
      <div className="flex h-full flex-col overflow-y-auto">
        {/* 3D hero */}
        <div className="shelf-room relative flex flex-col items-center border-b border-ink-700 px-6 pb-0 pt-14">
          <div className="[perspective:1300px]">
            <Book3D book={book} mode="cover" height={224} />
          </div>
          <div className="mt-9 w-full translate-y-[1px]">
            <div className="shelf-plank w-full" />
          </div>
        </div>

        <div className="flex flex-col gap-6 px-6 py-6">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-[24px] font-semibold leading-tight text-cream-50">{book.title}</h2>
                <p className="mt-0.5 text-sm text-cream-400">{book.author}</p>
              </div>
              <button
                onClick={() => onEdit(book)}
                className="flex items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-800 px-2.5 py-1.5 text-[11.5px] font-medium text-cream-300 transition hover:border-ink-500 hover:text-cream-100"
              >
                <PencilLine className="h-3.5 w-3.5" /> Edit
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-ink-600 bg-ink-800 px-2.5 py-1 text-[11px] font-medium text-cream-300">
                {book.genre}
              </span>
              {book.totalPages && (
                <span className="flex items-center gap-1.5 rounded-full border border-ink-600 bg-ink-800 px-2.5 py-1 text-[11px] font-medium text-cream-300">
                  <Layers className="h-3 w-3" /> {book.totalPages} pages
                </span>
              )}
              {book.isbn && (
                <span className="flex items-center gap-1.5 rounded-full border border-ink-600 bg-ink-800 px-2.5 py-1 text-[11px] font-medium text-cream-300">
                  <Hash className="h-3 w-3" /> {book.isbn}
                </span>
              )}
            </div>
            <div className="mt-4">
              <Stars
                value={book.rating}
                size={22}
                onChange={(rating) => void patch({ rating })}
              />
              <p className="mt-1 text-[11px] text-cream-600">
                {book.rating > 0 ? `You rated it ${book.rating} out of 5` : "Tap a star to rate it"}
              </p>
            </div>
          </div>

          {/* status */}
          <div>
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-cream-400">
              Shelf status
            </span>
            <div className="grid grid-cols-4 gap-1.5 rounded-2xl border border-ink-700 bg-ink-850 p-1.5">
              {STATUS_META.map((s) => (
                <button
                  key={s.key}
                  onClick={() => void patch({ status: s.key as BookStatus })}
                  className={cx(
                    "rounded-xl px-1 py-2 text-[11px] font-semibold transition-all",
                    book.status === s.key
                      ? "bg-ink-700 text-cream-50 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]"
                      : "text-cream-500 hover:text-cream-200"
                  )}
                >
                  <span className={cx("mx-auto mb-1 block h-1.5 w-1.5 rounded-full", s.dot)} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* progress */}
          {book.totalPages && book.status !== "want_to_read" && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cream-400">
                  Progress
                </span>
                <span className="text-[12px] font-semibold tabular-nums text-brass-300">{pct}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={book.totalPages}
                value={shownPage}
                onChange={(e) => setDragPage(+e.target.value)}
                onPointerUp={commitPage}
                onKeyUp={commitPage}
                onBlur={commitPage}
                className="fol-range w-full"
                style={{ "--fill": `${pct}%` } as React.CSSProperties}
              />
              <div className="mt-2.5 flex items-center justify-between text-[12px] text-cream-400">
                <span className="tabular-nums">
                  page {shownPage} of {book.totalPages}
                </span>
                <button
                  onClick={() => void patch({ currentPage: Math.min(book.totalPages!, book.currentPage + 10) })}
                  className="rounded-lg border border-ink-600 bg-ink-800 px-2.5 py-1 font-medium text-cream-200 transition hover:border-brass-500/50 hover:text-brass-200"
                >
                  +10 pages
                </button>
              </div>
            </div>
          )}

          {/* dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-ink-700 bg-ink-850 p-3">
              <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-cream-500">
                <CalendarPlus2 className="h-3 w-3" /> Started
              </p>
              <p className="mt-1 text-[13px] font-medium text-cream-100">{formatDate(book.startedAt)}</p>
            </div>
            <div className="rounded-xl border border-ink-700 bg-ink-850 p-3">
              <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-cream-500">
                <CalendarCheck2 className="h-3 w-3" /> Finished
              </p>
              <p className="mt-1 text-[13px] font-medium text-cream-100">{formatDate(book.finishedAt)}</p>
            </div>
          </div>

          {/* notes */}
          <Field label="Marginalia — your notes">
            <Textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => void saveNotes()}
              placeholder="Underlines, thoughts, quotes worth keeping…"
            />
          </Field>

          <div className="mt-2 border-t border-ink-700 pt-4">
            <Button
              variant="danger"
              onClick={doDelete}
              loading={busy}
              className={cx("w-full", confirmingDelete && "border-wine-400 bg-wine-500/25")}
            >
              <Trash2 className="h-4 w-4" />
              {confirmingDelete ? "Click again to remove forever" : "Remove from library"}
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
