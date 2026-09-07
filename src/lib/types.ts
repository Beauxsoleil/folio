import type { Book, BookStatus } from "@/db/schema";

export type { BookStatus };

/** Book row as serialized over the wire (dates become ISO strings). */
export type BookDTO = Omit<Book, "createdAt" | "updatedAt" | "startedAt" | "finishedAt"> & {
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
};

export type UserDTO = {
  id: string;
  email: string;
  name: string;
  readingGoal: number;
  createdAt: string;
};

export type StatusMeta = {
  key: BookStatus;
  label: string;
  plural: string;
  dot: string; // tailwind bg class
  text: string; // tailwind text class
  ring: string; // tailwind border/ring class
};

export const STATUS_META: StatusMeta[] = [
  {
    key: "reading",
    label: "Reading",
    plural: "Currently reading",
    dot: "bg-brass-400",
    text: "text-brass-300",
    ring: "border-brass-500/40",
  },
  {
    key: "finished",
    label: "Finished",
    plural: "Finished",
    dot: "bg-sage-400",
    text: "text-sage-300",
    ring: "border-sage-500/40",
  },
  {
    key: "want_to_read",
    label: "Want to read",
    plural: "Up next",
    dot: "bg-denim-400",
    text: "text-denim-300",
    ring: "border-denim-500/40",
  },
  {
    key: "paused",
    label: "Paused",
    plural: "Paused",
    dot: "bg-wine-400",
    text: "text-wine-300",
    ring: "border-wine-500/40",
  },
];

export function statusMeta(status: string): StatusMeta {
  return STATUS_META.find((s) => s.key === status) ?? STATUS_META[2];
}

export type MonthlyPoint = { label: string; books: number; pages: number };
export type HeatPoint = { day: string; pages: number };
export type GenrePoint = { genre: string; count: number };

export type StatsDTO = {
  total: number;
  reading: number;
  finished: number;
  want: number;
  paused: number;
  pagesTracked: number;
  pagesThisYear: number;
  finishedThisYear: number;
  finishedThisMonth: number;
  readingGoal: number;
  streak: number;
  avgRating: number;
  monthly: MonthlyPoint[];
  genres: GenrePoint[];
  heatmap: HeatPoint[];
};
