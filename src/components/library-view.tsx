"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookMarked, LibraryBig, Plus, Search, SearchX } from "lucide-react";
import { api } from "@/lib/client";
import type { BookDTO } from "@/lib/types";
import { STATUS_META } from "@/lib/types";
import { clamp, cx } from "@/lib/utils";
import { Button, EmptyState, Input, Progress, Select, Skeleton, Stars } from "@/components/ui";
import { BookCover } from "@/components/book-cover";
import { BookDrawer } from "@/components/book-drawer";
import { BookFormDialog, GENRES, type BookFormPayload } from "@/components/book-form-dialog";
import { useToast } from "@/components/toast";

type SortKey = "updated" | "added" | "title" | "rating" | "pages";

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "updated", label: "Recently shelved" },
  { key: "added", label: "Newest first" },
  { key: "title", label: "Title A–Z" },
  { key: "rating", label: "Highest rated" },
  { key: "pages", label: "Longest books" },
];

function sortBooks(books: BookDTO[], sort: SortKey): BookDTO[] {
  const arr = [...books];
  switch (sort) {
    case "updated":
      return arr.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
    case "added":
      return arr.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    case "title":
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    case "rating":
      return arr.sort((a, b) => b.rating - a.rating);
    case "pages":
      return arr.sort((a, b) => (b.totalPages ?? 0) - (a.totalPages ?? 0));
  }
}

export function LibraryView({
  initialBooks,
  initialAddOpen,
}: {
  initialBooks: BookDTO[];
  initialAddOpen: boolean;
}) {
  const [books, setBooks] = useState<BookDTO[]>(initialBooks);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [genre, setGenre] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("updated");
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(initialAddOpen);
  const [editing, setEditing] = useState<BookDTO | null>(null);
  const router = useRouter();
  const toast = useToast();

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: books.length };
    for (const s of STATUS_META) c[s.key] = 0;
    for (const b of books) c[b.status] = (c[b.status] ?? 0) + 1;
    return c;
  }, [books]);

  const presentGenres = useMemo(
    () => [...new Set(books.map((b) => b.genre))].sort(),
    [books]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = books.filter((b) => {
      if (status !== "all" && b.status !== status) return false;
      if (genre !== "all" && b.genre !== genre) return false;
      if (q && !(`${b.title} ${b.author}`.toLowerCase().includes(q))) return false;
      return true;
    });
    return sortBooks(filtered, sort);
  }, [books, query, status, genre, sort]);

  const drawerBook = drawerId ? books.find((b) => b.id === drawerId) ?? null : null;

  /* ------------------ optimistic CRUD ------------------ */

  const addBook = async (payload: BookFormPayload) => {
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    const optimistic: BookDTO = {
      id: tempId,
      userId: "me",
      title: payload.title,
      author: payload.author,
      isbn: payload.isbn,
      coverUrl: payload.coverUrl,
      openLibraryKey: payload.openLibraryKey,
      status: payload.status,
      rating: 0,
      genre: payload.genre,
      currentPage: 0,
      totalPages: payload.totalPages,
      notes: null,
      startedAt: payload.status !== "want_to_read" ? now : null,
      finishedAt: payload.status === "finished" ? now : null,
      position: 9999,
      createdAt: now,
      updatedAt: now,
    };
    setBooks((b) => [...b, optimistic]);
    try {
      const { book } = await api<{ book: BookDTO }>("/api/books", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setBooks((b) => b.map((x) => (x.id === tempId ? book : x)));
      toast.push("success", `“${book.title}” placed on your shelves`);
      router.refresh();
    } catch (err) {
      setBooks((b) => b.filter((x) => x.id !== tempId));
      toast.push("error", err instanceof Error ? err.message : "Could not add the book.");
    }
  };

  const editBook = async (payload: BookFormPayload, id?: string) => {
    if (!id) return;
    const snapshot = books;
    setBooks((b) => b.map((x) => (x.id === id ? { ...x, ...payload } : x)));
    try {
      const { book } = await api<{ book: BookDTO }>(`/api/books/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setBooks((b) => b.map((x) => (x.id === id ? book : x)));
      toast.push("success", "Changes saved");
      router.refresh();
    } catch (err) {
      setBooks(snapshot);
      toast.push("error", err instanceof Error ? err.message : "Could not save changes.");
    }
  };

  const patchBook = async (id: string, patch: Partial<BookDTO>) => {
    const snapshot = books;
    setBooks((b) => b.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    try {
      const { book } = await api<{ book: BookDTO }>(`/api/books/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setBooks((b) => b.map((x) => (x.id === id ? book : x)));
      if (patch.status === "finished") toast.push("success", "Finished! Another for the history shelf.");
      else if (patch.currentPage !== undefined) toast.push("info", "Progress saved");
      router.refresh();
    } catch (err) {
      setBooks(snapshot);
      toast.push("error", err instanceof Error ? err.message : "Update failed.");
    }
  };

  const removeBook = async (id: string) => {
    const snapshot = books;
    const removed = books.find((b) => b.id === id);
    setBooks((b) => b.filter((x) => x.id !== id));
    setDrawerId(null);
    try {
      await api(`/api/books/${id}`, { method: "DELETE" });
      toast.push("info", removed ? `“${removed.title}” removed from the library` : "Book removed");
      router.refresh();
    } catch (err) {
      setBooks(snapshot);
      toast.push("error", err instanceof Error ? err.message : "Delete failed.");
    }
  };

  /* ------------------ render ------------------ */

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="font-display text-[34px] font-semibold leading-tight tracking-tight text-cream-50 sm:text-[40px]">
            The <span className="italic text-brass-300">Library</span>
          </h1>
          <p className="mt-1 text-sm text-cream-400">
            {counts.all} volume{counts.all === 1 ? "" : "s"} catalogued · {counts.reading ?? 0} in progress
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" /> Add a book
        </Button>
      </div>

      {/* toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-ink-700 bg-ink-900/70 p-1.5">
          {[{ key: "all", label: "All", dot: "bg-cream-300" }, ...STATUS_META].map((s) => (
            <button
              key={s.key}
              onClick={() => setStatus(s.key)}
              className={cx(
                "flex items-center gap-2 rounded-xl px-3 py-1.5 text-[12.5px] font-medium transition",
                status === s.key
                  ? "bg-ink-700 text-cream-50 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]"
                  : "text-cream-400 hover:text-cream-100"
              )}
            >
              <span className={cx("h-1.5 w-1.5 rounded-full", s.dot)} />
              {s.label}
              <span className="tabular-nums text-[11px] text-cream-500">{counts[s.key] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-52 flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title or author…"
              className="pl-10"
            />
          </div>
          <Select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-40">
            <option value="all">All genres</option>
            {presentGenres.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
            {presentGenres.length === 0 && GENRES.slice(1).map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="w-44">
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* grid */}
      {books.length === 0 ? (
        <EmptyState
          icon={<LibraryBig className="h-6 w-6" />}
          title="Your shelves are bare"
          description="Add your first book — search its title to pull in the official cover art, or enter it by hand."
          action={
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4" /> Add your first book
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<SearchX className="h-6 w-6" />}
          title="Nothing matches"
          description="No books fit the current search and filters. Loosen them up a little."
          action={
            <Button variant="secondary" onClick={() => { setQuery(""); setStatus("all"); setGenre("all"); }}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((b, i) => {
            const meta = STATUS_META.find((s) => s.key === b.status) ?? STATUS_META[0];
            const pct = b.totalPages ? clamp(Math.round((b.currentPage / b.totalPages) * 100), 0, 100) : 0;
            return (
              <button
                key={b.id}
                onClick={() => setDrawerId(b.id)}
                className="group flex flex-col text-left animate-fade-up"
                style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-ink-700 bg-ink-800 shadow-[0_16px_30px_-16px_rgba(0,0,0,.85)] transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_26px_40px_-18px_rgba(0,0,0,.9)]">
                  <BookCover
                    title={b.title}
                    author={b.author}
                    coverUrl={b.coverUrl}
                    className="h-full w-full transition duration-300 group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
                  />
                  <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2">
                    <span
                      className={cx(
                        "flex items-center gap-1.5 rounded-full border bg-ink-950/75 px-2 py-0.5 text-[10px] font-semibold backdrop-blur",
                        meta.ring, meta.text
                      )}
                    >
                      <span className={cx("h-1.5 w-1.5 rounded-full", meta.dot)} />
                      {meta.label}
                    </span>
                    <span className="rounded-full bg-ink-950/75 p-1.5 text-cream-200 opacity-0 backdrop-blur transition group-hover:opacity-100">
                      <BookMarked className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  {b.status === "reading" && b.totalPages != null && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/90 to-transparent p-2 pt-6">
                      <Progress value={pct} />
                      <p className="mt-1 text-right text-[10px] font-semibold tabular-nums text-cream-200">{pct}%</p>
                    </div>
                  )}
                </div>
                <div className="mt-2.5 px-0.5">
                  <p className="truncate text-[13.5px] font-semibold text-cream-100">{b.title}</p>
                  <p className="truncate text-[11.5px] text-cream-500">{b.author}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <Stars value={b.rating} size={11} />
                    {b.totalPages && (
                      <span className="text-[10px] font-medium tabular-nums text-cream-600">{b.totalPages}p</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <BookFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={editing ? editBook : addBook}
        editing={editing}
      />
      <BookDrawer
        book={drawerBook}
        onClose={() => setDrawerId(null)}
        onPatch={patchBook}
        onDelete={removeBook}
        onEdit={(b) => { setEditing(b); setDrawerId(null); setFormOpen(true); }}
      />
    </div>
  );
}

export function LibrarySkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-12 w-full" />
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="aspect-[2/3] w-full" />
            <Skeleton className="mt-2 h-3 w-3/4" />
            <Skeleton className="mt-1.5 h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
