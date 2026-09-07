"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes, BookPlus, MousePointerClick } from "lucide-react";
import { api } from "@/lib/client";
import type { BookDTO } from "@/lib/types";
import { STATUS_META } from "@/lib/types";
import { Button, Skeleton } from "@/components/ui";
import { ShelfScene } from "@/components/shelf-scene";
import { BookDrawer } from "@/components/book-drawer";
import { BookFormDialog, type BookFormPayload } from "@/components/book-form-dialog";
import { useToast } from "@/components/toast";

const EMPTY_HINTS: Record<string, string> = {
  reading: "Nothing on the nightstand — pick a spine and begin.",
  finished: "The hall of fame awaits its first champion.",
  want_to_read: "No dreams queued yet. Every reader needs a next book.",
  paused: "No bookmarked pauses. Yours are all in motion.",
};

export function ShelfView({ initialBooks }: { initialBooks: BookDTO[] }) {
  const [books, setBooks] = useState<BookDTO[]>(initialBooks);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const shelves = useMemo(
    () =>
      STATUS_META.map((s, i) => ({
        key: s.key,
        label: `${["I", "II", "III", "IV"][i]} · ${s.plural}`,
        books: books
          .filter((b) => b.status === s.key)
          .sort((a, b) => a.position - b.position),
        emptyHint: EMPTY_HINTS[s.key],
      })),
    [books]
  );

  const drawerBook = drawerId ? books.find((b) => b.id === drawerId) ?? null : null;

  const addBook = async (payload: BookFormPayload) => {
    try {
      const { book } = await api<{ book: BookDTO }>("/api/books", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setBooks((b) => [...b, book]);
      toast.push("success", `“${book.title}” placed on your shelves`);
      router.refresh();
    } catch (err) {
      toast.push("error", err instanceof Error ? err.message : "Could not add the book.");
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
      router.refresh();
    } catch (err) {
      setBooks(snapshot);
      toast.push("error", err instanceof Error ? err.message : "Update failed.");
    }
  };

  const removeBook = async (id: string) => {
    const snapshot = books;
    setBooks((b) => b.filter((x) => x.id !== id));
    setDrawerId(null);
    try {
      await api(`/api/books/${id}`, { method: "DELETE" });
      toast.push("info", "Book removed from the library");
      router.refresh();
    } catch (err) {
      setBooks(snapshot);
      toast.push("error", err instanceof Error ? err.message : "Delete failed.");
    }
  };

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="font-display text-[34px] font-semibold leading-tight tracking-tight text-cream-50 sm:text-[40px]">
            The <span className="italic text-brass-300">3D Shelf</span>
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-cream-400">
            <MousePointerClick className="h-3.5 w-3.5 text-brass-300" />
            Hover a spine to pull the book into the light — click to open it.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setFormOpen(true)}>
          <BookPlus className="h-4 w-4 text-brass-300" /> Add a book
        </Button>
      </div>

      {books.length === 0 ? (
        <div className="animate-fade-up">
          <ShelfScene
            shelves={[{ key: "empty", label: "I · Your future library", books: [] }]}
          />
          <div className="mt-5 flex justify-center">
            <Button onClick={() => setFormOpen(true)}>
              <BookPlus className="h-4 w-4" /> Shelve your first book
            </Button>
          </div>
        </div>
      ) : (
        <div className="animate-fade-up" style={{ animationDelay: "80ms" }}>
          <ShelfScene shelves={shelves} onSelect={(b) => setDrawerId(b.id)} bookHeight={204} />
        </div>
      )}

      <p className="flex items-center justify-center gap-2 text-center text-[11.5px] text-cream-600">
        <Boxes className="h-3.5 w-3.5" />
        Spine widths follow page counts · Official art wrapped from the Open Library catalog
      </p>

      <BookFormDialog open={formOpen} onClose={() => setFormOpen(false)} onSubmit={addBook} editing={null} />
      <BookDrawer
        book={drawerBook}
        onClose={() => setDrawerId(null)}
        onPatch={patchBook}
        onDelete={removeBook}
        onEdit={() => {}}
      />
    </div>
  );
}

export function ShelfSkeleton() {
  return (
    <div className="flex flex-col gap-9">
      <Skeleton className="h-10 w-72" />
      {[0, 1].map((i) => (
        <div key={i}>
          <Skeleton className="mb-2 h-4 w-44" />
          <Skeleton className="h-60 w-full" />
        </div>
      ))}
    </div>
  );
}
