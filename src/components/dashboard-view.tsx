"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BookCheck,
  BookOpen,
  Flame,
  Layers,
  Plus,
  ScrollText,
  Target,
} from "lucide-react";
import type { BookDTO, StatsDTO } from "@/lib/types";
import { cx, formatDate, formatNumber } from "@/lib/utils";
import { Progress, Stars, useCountUp } from "@/components/ui";
import { BookCover } from "@/components/book-cover";
import { Shelf, type ShelfBook } from "@/components/shelf-scene";

/* ------------------------------------------------------------------ */

function Counter({ value, suffix }: { value: number; suffix?: string }) {
  const v = useCountUp(value);
  return (
    <span className="font-display text-[34px] font-semibold leading-none tabular-nums text-cream-50">
      {formatNumber(v)}
      {suffix && <span className="ml-0.5 text-lg text-cream-400">{suffix}</span>}
    </span>
  );
}

const CARD =
  "rounded-2xl border border-ink-700 bg-ink-900/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tint,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  sub: string;
  tint: string;
  delay: number;
}) {
  return (
    <div className={cx(CARD, "p-5 animate-fade-up")} style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between">
        <span className={cx("flex h-9 w-9 items-center justify-center rounded-xl border", tint)}>
          <Icon className="h-[17px] w-[17px]" />
        </span>
      </div>
      <div className="mt-4">
        <Counter value={value} />
      </div>
      <p className="mt-1 text-[12px] font-semibold text-cream-200">{label}</p>
      <p className="text-[11px] text-cream-500">{sub}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function GoalRing({ done, target }: { done: number; target: number }) {
  const pct = target > 0 ? Math.min(1, done / target) : 0;
  const R = 52;
  const C = 2 * Math.PI * R;
  const shown = useCountUp(done);
  return (
    <div className="relative mx-auto h-40 w-40">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={R} fill="none" stroke="#241e17" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={R}
          fill="none"
          stroke="url(#goalGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct)}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1)" }}
        />
        <defs>
          <linearGradient id="goalGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e6c684" />
            <stop offset="100%" stopColor="#c6903f" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-semibold tabular-nums text-cream-50">{shown}</span>
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-cream-500">
          of {target} books
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function MiniBars({ monthly }: { monthly: StatsDTO["monthly"] }) {
  const max = Math.max(1, ...monthly.map((m) => m.books));
  return (
    <div className="flex h-32 items-end gap-2">
      {monthly.map((m, i) => (
        <div key={i} className="group relative flex flex-1 flex-col items-center gap-1.5">
          <span className="pointer-events-none absolute -top-7 rounded-md border border-ink-600 bg-ink-800 px-2 py-0.5 text-[10px] font-medium text-cream-100 opacity-0 shadow-lg transition group-hover:opacity-100">
            {m.books} {m.books === 1 ? "book" : "books"}
          </span>
          <div
            className={cx(
              "w-full max-w-7 rounded-t-md transition-all duration-500",
              m.books > 0
                ? "bg-gradient-to-t from-brass-600/70 to-brass-300 group-hover:brightness-125"
                : "bg-ink-700"
            )}
            style={{ height: `${Math.max(6, (m.books / max) * 100)}%` }}
          />
          <span className="text-[9.5px] font-medium text-cream-600">{m.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function DashboardView({
  user,
  greeting,
  stats,
  books,
}: {
  user: string;
  greeting: string;
  stats: StatsDTO;
  books: BookDTO[];
}) {
  const router = useRouter();
  const reading = books.filter((b) => b.status === "reading");
  const upNext = books.filter((b) => b.status === "want_to_read").slice(0, 8);
  const recentFinished = books
    .filter((b) => b.status === "finished" && b.finishedAt)
    .sort((a, b) => +new Date(b.finishedAt!) - +new Date(a.finishedAt!))
    .slice(0, 4);

  const dateLine = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-8">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4 animate-fade-up">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] of text-cream-500">{dateLine}</p>
          <h1 className="mt-1 font-display text-[34px] font-semibold leading-tight tracking-tight text-cream-50 sm:text-[40px]">
            {greeting}, <span className="italic text-brass-300">{user}</span>.
          </h1>
          <p className="mt-1 max-w-md text-sm text-cream-400">
            {stats.reading > 0
              ? `You have ${stats.reading} book${stats.reading > 1 ? "s" : ""} in progress and ${formatNumber(stats.pagesThisYear)} pages behind you this year.`
              : "Your armchair is ready. Pick a spine and start a new chapter."}
          </p>
        </div>
        <Link
          href="/library?add=1"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-brass-300 to-brass-500 px-4 py-2.5 text-sm font-medium text-ink-950 shadow-[inset_0_1px_0_rgba(255,244,214,.65),0_8px_18px_-8px_rgba(198,144,63,.7)] transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> Add a book
        </Link>
      </div>

      {/* book counters */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          icon={Layers}
          label="Books shelved"
          value={stats.total}
          sub="across your whole library"
          tint="border-brass-500/30 bg-brass-500/10 text-brass-300"
          delay={40}
        />
        <StatCard
          icon={ScrollText}
          label="Pages turned"
          value={stats.pagesTracked}
          sub={`${formatNumber(stats.pagesThisYear)} this year`}
          tint="border-denim-500/30 bg-denim-500/10 text-denim-300"
          delay={90}
        />
        <StatCard
          icon={BookCheck}
          label={`Finished in ${new Date().getFullYear()}`}
          value={stats.finishedThisYear}
          sub={`${stats.finishedThisMonth} this month`}
          tint="border-sage-500/30 bg-sage-500/10 text-sage-300"
          delay={140}
        />
        <StatCard
          icon={Flame}
          label="Day streak"
          value={stats.streak}
          sub={stats.streak > 0 ? "keep the flame alive" : "read a page to ignite"}
          tint="border-wine-500/30 bg-wine-500/10 text-wine-300"
          delay={190}
        />
      </div>

      {/* goal + featured shelf */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className={cx(CARD, "flex flex-col p-6 animate-fade-up")} style={{ animationDelay: "160ms" }}>
          <div className="flex items-center gap-2.5">
            <Target className="h-4 w-4 text-brass-300" />
            <h2 className="font-display text-lg font-semibold text-cream-50">
              {new Date().getFullYear()} reading goal
            </h2>
          </div>
          <div className="flex flex-1 items-center justify-center py-5">
            <GoalRing done={stats.finishedThisYear} target={stats.readingGoal} />
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-ink-700 pt-4 text-center">
            <div>
              <p className="font-display text-xl font-semibold text-cream-50">{stats.finished}</p>
              <p className="text-[10.5px] uppercase tracking-[0.12em] text-cream-500">finished all-time</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5">
                <p className="font-display text-xl font-semibold text-cream-50">{stats.avgRating || "—"}</p>
              </div>
              <p className="text-[10.5px] uppercase tracking-[0.12em] text-cream-500">avg. rating</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 animate-fade-up" style={{ animationDelay: "220ms" }}>
          <div className="mb-2.5 flex items-center justify-between px-1">
            <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold text-cream-50">
              <BookOpen className="h-4 w-4 text-brass-300" /> On your nightstand
            </h2>
            <Link
              href="/shelf"
              className="group flex items-center gap-1 text-[12.5px] font-medium text-cream-400 transition hover:text-brass-300"
            >
              Open the 3D shelf
              <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
          <Shelf
            books={reading as ShelfBook[]}
            mode="cover"
            bookHeight={196}
            onSelect={() => router.push("/shelf")}
            emptyHint="Nothing in progress — start your next book from the library."
          />
          {reading.map((b) => (
            <div key={b.id} className="mt-3 flex items-center gap-3 px-1">
              <Progress value={b.totalPages ? (b.currentPage / b.totalPages) * 100 : 0} className="flex-1" />
              <span className="whitespace-nowrap text-[11.5px] font-medium tabular-nums text-cream-400">
                {b.title.length > 26 ? b.title.slice(0, 26) + "…" : b.title} —{" "}
                {b.totalPages ? Math.round((b.currentPage / b.totalPages) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* bottom grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className={cx(CARD, "p-6 animate-fade-up")} style={{ animationDelay: "260ms" }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-cream-50">Up next</h2>
            <Link href="/library" className="group flex items-center gap-1 text-[12px] font-medium text-cream-400 hover:text-brass-300">
              Library <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
          {upNext.length === 0 ? (
            <p className="py-8 text-center text-[13px] italic text-cream-500">
              No to-be-read pile. Dangerous — browse Open Library to fix that.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {upNext.map((b) => (
                <Link key={b.id} href="/library" className="group" title={`${b.title} — ${b.author}`}>
                  <div className="relative aspect-[2/3] overflow-hidden rounded-md border border-ink-600 shadow-[0_8px_16px_-8px_rgba(0,0,0,.8)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-brass-500/20">
                    <BookCover title={b.title} author={b.author} coverUrl={b.coverUrl} className="h-full w-full" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className={cx(CARD, "p-6 animate-fade-up")} style={{ animationDelay: "320ms" }}>
          <h2 className="mb-4 font-display text-lg font-semibold text-cream-50">Recently finished</h2>
          {recentFinished.length === 0 ? (
            <p className="py-8 text-center text-[13px] italic text-cream-500">
              Finished books will gather here, gold-starred and proud.
            </p>
          ) : (
            <ul className="flex flex-col gap-3.5">
              {recentFinished.map((b) => (
                <li key={b.id} className="flex items-center gap-3">
                  <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-[4px] border border-ink-600">
                    <BookCover title={b.title} author={b.author} coverUrl={b.coverUrl} className="h-full w-full" sizes="60px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-cream-100">{b.title}</p>
                    <p className="truncate text-[11.5px] text-cream-500">{b.author}</p>
                    <Stars value={b.rating} size={11} className="mt-1" />
                  </div>
                  <span className="text-[10.5px] font-medium text-cream-600">{formatDate(b.finishedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={cx(CARD, "p-6 animate-fade-up")} style={{ animationDelay: "380ms" }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-cream-50">Books per month</h2>
            <Link href="/insights" className="group flex items-center gap-1 text-[12px] font-medium text-cream-400 hover:text-brass-300">
              Insights <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
          <MiniBars monthly={stats.monthly} />
          <p className="mt-4 border-t border-ink-700 pt-3 text-center text-[11.5px] text-cream-500">
            {stats.finishedThisYear} finished in {new Date().getFullYear()} · goal {stats.readingGoal}
          </p>
        </div>
      </div>
    </div>
  );
}
