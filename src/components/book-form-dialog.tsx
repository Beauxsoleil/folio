"use client";

import { useEffect, useState } from "react";
import { BookPlus, Check, ImageOff, Loader2, PencilLine, Search, X } from "lucide-react";
import { api } from "@/lib/client";
import type { BookDTO, BookStatus } from "@/lib/types";
import { STATUS_META } from "@/lib/types";
import { cx } from "@/lib/utils";
import { Button, Field, Input, Modal, Select, useDebounced } from "@/components/ui";
import { BookCover } from "@/components/book-cover";
import type { BookSearchResult } from "@/lib/openlibrary";

export const GENRES = [
  "General",
  "Fiction",
  "Literary",
  "Sci-Fi",
  "Fantasy",
  "Thriller",
  "Mystery",
  "Romance",
  "History",
  "Memoir",
  "Classics",
  "Psychology",
  "Self-Help",
  "Science",
  "Poetry",
  "Young Adult",
  "Horror",
  "Biography",
];

export type BookFormPayload = {
  title: string;
  author: string;
  genre: string;
  status: BookStatus;
  totalPages: number | null;
  coverUrl: string | null;
  isbn: string | null;
  openLibraryKey: string | null;
};

function SearchResults({
  query,
  onPick,
  pickedKey,
}: {
  query: string;
  onPick: (r: BookSearchResult) => void;
  pickedKey: string | null;
}) {
  const debounced = useDebounced(query, 320);
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (debounced.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api<{ results: BookSearchResult[] }>(`/api/covers?q=${encodeURIComponent(debounced.trim())}`)
      .then((d) => !cancelled && setResults(d.results))
      .catch(() => !cancelled && setResults([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  if (loading)
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-cream-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-[13px]">Searching the stacks…</span>
      </div>
    );

  if (debounced.trim().length >= 2 && results.length === 0)
    return <p className="py-8 text-center text-[13px] italic text-cream-500">No matches found. Try fewer words.</p>;

  return (
    <ul className="flex max-h-64 flex-col gap-1.5 overflow-y-auto pr-1">
      {results.map((r) => (
        <li key={r.key + r.title}>
          <button
            type="button"
            onClick={() => onPick(r)}
            className={cx(
              "flex w-full items-center gap-3 rounded-xl border p-2 text-left transition",
              pickedKey === r.key
                ? "border-brass-500/60 bg-brass-500/10"
                : "border-ink-600 bg-ink-900 hover:border-ink-500 hover:bg-ink-800"
            )}
          >
            <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded border border-ink-600 bg-ink-800">
              {r.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-cream-600">
                  <ImageOff className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-semibold text-cream-100">{r.title}</p>
              <p className="truncate text-[11.5px] text-cream-500">
                {r.author}
                {r.firstPublishYear ? ` · ${r.firstPublishYear}` : ""}
                {r.pages ? ` · ${r.pages}p` : ""}
              </p>
            </div>
            {pickedKey === r.key && <Check className="h-4 w-4 shrink-0 text-brass-300" />}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function BookFormDialog({
  open,
  onClose,
  onSubmit,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: BookFormPayload, id?: string) => Promise<void>;
  editing: BookDTO | null;
}) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<BookSearchResult | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("General");
  const [status, setStatus] = useState<BookStatus>("want_to_read");
  const [totalPages, setTotalPages] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [isbn, setIsbn] = useState<string | null>(null);
  const [olKey, setOlKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // hydrate when opened
  useEffect(() => {
    if (!open) return;
    setError(null);
    setSaving(false);
    if (editing) {
      setTitle(editing.title);
      setAuthor(editing.author);
      setGenre(editing.genre);
      setStatus(editing.status as BookStatus);
      setTotalPages(editing.totalPages ? String(editing.totalPages) : "");
      setCoverUrl(editing.coverUrl);
      setIsbn(editing.isbn);
      setOlKey(editing.openLibraryKey);
      setPicked(null);
      setQuery("");
    } else {
      setTitle("");
      setAuthor("");
      setGenre("General");
      setStatus("want_to_read");
      setTotalPages("");
      setCoverUrl(null);
      setIsbn(null);
      setOlKey(null);
      setPicked(null);
      setQuery("");
    }
  }, [open, editing]);

  const pick = (r: BookSearchResult) => {
    setPicked(r);
    setTitle(r.title);
    setAuthor(r.author);
    setCoverUrl(r.coverUrl);
    setIsbn(r.isbn);
    setOlKey(r.key);
    if (r.pages) setTotalPages(String(r.pages));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("A title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(
        {
          title: title.trim(),
          author: author.trim() || "Unknown author",
          genre,
          status,
          totalPages: totalPages ? Math.round(+totalPages) : null,
          coverUrl,
          isbn,
          openLibraryKey: olKey,
        },
        editing?.id
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the book.");
    } finally {
      setSaving(false);
    }
  };

  const previewTitle = title || "Untitled";
  const previewAuthor = author || "Unknown author";

  return (
    <Modal open={open} onClose={onClose} className="max-w-xl">
      <form onSubmit={submit}>
        <div className="flex items-center justify-between border-b border-ink-700 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brass-500/15 text-brass-300">
              {editing ? <PencilLine className="h-4 w-4" /> : <BookPlus className="h-4 w-4" />}
            </span>
            <h2 className="font-display text-lg font-semibold text-cream-50">
              {editing ? "Edit book" : "Add to the shelves"}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-cream-500 hover:bg-ink-700 hover:text-cream-200" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {!editing && (
            <div className="mb-5">
              <Field label="Find official cover art" hint="Live from Open Library — the same catalog Kindle draws from.">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-500" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by title or author…"
                    className="pl-10"
                  />
                </div>
              </Field>
              {query.trim().length >= 2 && (
                <div className="mt-3">
                  <SearchResults query={query} onPick={pick} pickedKey={picked?.key ?? null} />
                </div>
              )}
              {query.trim().length < 2 && !coverUrl && (
                <p className="mt-2 text-[11.5px] italic text-cream-600">
                  …or skip the search and type everything by hand below.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-5">
            {/* preview */}
            <div className="w-24 shrink-0">
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-ink-600 bg-ink-800 shadow-[0_14px_26px_-12px_rgba(0,0,0,.8)]">
                <BookCover title={previewTitle} author={previewAuthor} coverUrl={coverUrl} className="h-full w-full" sizes="96px" />
              </div>
              {coverUrl && (
                <button
                  type="button"
                  onClick={() => setCoverUrl(null)}
                  className="mt-2 w-full text-center text-[10.5px] font-medium text-cream-500 hover:text-wine-300"
                >
                  Remove art
                </button>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-3.5">
              <Field label="Title">
                <Input autoFocus={!editing} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The Name of the Wind" required />
              </Field>
              <Field label="Author">
                <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Patrick Rothfuss" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Genre">
                  <Select value={genre} onChange={(e) => setGenre(e.target.value)}>
                    {GENRES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Pages">
                  <Input
                    type="number"
                    min={1}
                    max={10000}
                    value={totalPages}
                    onChange={(e) => setTotalPages(e.target.value)}
                    placeholder="320"
                  />
                </Field>
              </div>
              <Field label="Shelve as">
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_META.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setStatus(s.key)}
                      className={cx(
                        "flex items-center gap-2 rounded-xl border px-3 py-2 text-[12.5px] font-medium transition",
                        status === s.key
                          ? cx("bg-ink-750 text-cream-50", s.ring)
                          : "border-ink-600 bg-ink-900 text-cream-400 hover:border-ink-500"
                      )}
                    >
                      <span className={cx("h-2 w-2 rounded-full", s.dot)} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-wine-500/40 bg-wine-500/10 px-3.5 py-2.5 text-[13px] text-wine-200 animate-pop-in">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-ink-700 px-6 py-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>
            {editing ? "Save changes" : "Place on shelf"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
