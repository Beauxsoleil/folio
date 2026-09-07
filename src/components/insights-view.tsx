"use client";

import { useState } from "react";
import { BarChart3, BookCheck, CakeSlice, CalendarDays, Flame, Footprints, Gauge } from "lucide-react";
import type { StatsDTO } from "@/lib/types";
import { cx, formatNumber } from "@/lib/utils";
import { useCountUp } from "@/components/ui";

const CARD =
  "rounded-2xl border border-ink-700 bg-ink-900/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]";

const HEAT_STOPS = ["#241e17", "#4a3417", "#8a6126", "#c6903f", "#e6c684"];

function heatColor(pages: number): string {
  if (pages <= 0) return HEAT_STOPS[0];
  if (pages < 15) return HEAT_STOPS[1];
  if (pages < 30) return HEAT_STOPS[2];
  if (pages < 55) return HEAT_STOPS[3];
  return HEAT_STOPS[4];
}

function Heatmap({ data }: { data: StatsDTO["heatmap"] }) {
  // Chunk into columns of 7 days (weeks).
  const weeks: typeof data[] = [];
  for (let i = 0; i < data.length; i += 7) weeks.push(data.slice(i, i + 7));
  return (
    <div>
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex w-[13px] shrink-0 flex-col gap-[3px]">
            {week.map((d) => (
              <div
                key={d.day}
                className="heat-cell transition hover:ring-1 hover:ring-brass-300"
                style={{ background: heatColor(d.pages) }}
                title={`${d.day}: ${d.pages} pages`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] font-medium text-cream-500">
        Less
        {HEAT_STOPS.map((c) => (
          <span key={c} className="heat-cell !w-[11px]" style={{ background: c }} />
        ))}
        More
      </div>
    </div>
  );
}

function Donut({ genres }: { genres: StatsDTO["genres"] }) {
  const COLORS = ["#d9ac5d", "#8db17e", "#81a2bd", "#bd7f7b", "#a78bca", "#6fa8a0", "#ab9c7e"];
  const total = genres.reduce((s, g) => s + g.count, 0) || 1;
  const R = 15.9;
  let offset = 25;
  const segs = genres.map((g, i) => {
    const frac = (g.count / total) * 100;
    const seg = { ...g, color: COLORS[i % COLORS.length], dash: `${frac} ${100 - frac}`, off: offset };
    offset -= frac;
    return seg;
  });
  return (
    <div className="flex items-center gap-6">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 42 42" className="h-full w-full">
          <circle cx="21" cy="21" r={R} fill="none" stroke="#241e17" strokeWidth="5" />
          {segs.map((s) => (
            <circle
              key={s.genre}
              cx="21"
              cy="21"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="5"
              strokeDasharray={s.dash}
              strokeDashoffset={s.off}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-semibold tabular-nums text-cream-50">{total}</span>
          <span className="text-[9.5px] uppercase tracking-[0.14em] text-cream-500">volumes</span>
        </div>
      </div>
      <ul className="flex flex-1 flex-col gap-2">
        {segs.map((s) => (
          <li key={s.genre} className="flex items-center gap-2.5 text-[12.5px]">
            <span className="h-2.5 w-2.5 rounded-[4px]" style={{ background: s.color }} />
            <span className="flex-1 truncate font-medium text-cream-200">{s.genre}</span>
            <span className="tabular-nums text-cream-500">{s.count}</span>
            <span className="w-10 text-right text-[11px] tabular-nums text-cream-600">
              {Math.round((s.count / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BigBars({ monthly, mode }: { monthly: StatsDTO["monthly"]; mode: "books" | "pages" }) {
  const values = monthly.map((m) => (mode === "books" ? m.books : m.pages));
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-48 items-end gap-2.5">
      {monthly.map((m, i) => {
        const v = mode === "books" ? m.books : m.pages;
        return (
          <div key={i} className="group relative flex flex-1 flex-col items-center gap-2">
            <span className="pointer-events-none absolute -top-8 whitespace-nowrap rounded-md border border-ink-600 bg-ink-800 px-2 py-1 text-[10.5px] font-medium text-cream-100 opacity-0 shadow-xl transition group-hover:opacity-100">
              {mode === "books" ? `${v} finished` : `${formatNumber(v)} pages`}
            </span>
            <span className="text-[10px] font-semibold tabular-nums text-cream-400 opacity-0 transition group-hover:opacity-100">
              {mode === "pages" ? formatNumber(v) : v}
            </span>
            <div
              className={cx(
                "w-full max-w-10 rounded-t-lg transition-all duration-500 group-hover:brightness-125",
                v > 0 ? "bg-gradient-to-t from-brass-600/80 via-brass-500 to-brass-300" : "bg-ink-700"
              )}
              style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
            />
            <span className="text-[10px] font-medium text-cream-500">{m.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function InsightsView({ stats }: { stats: StatsDTO }) {
  const [mode, setMode] = useState<"books" | "pages">("books");
  const pagesShown = useCountUp(stats.pagesTracked);
  const avgPerDay = useCountUp(Math.round(stats.pagesTracked / 365));

  return (
    <div className="flex flex-col gap-7">
      <div className="animate-fade-up">
        <h1 className="font-display text-[34px] font-semibold leading-tight tracking-tight text-cream-50 sm:text-[40px]">
          Reading <span className="italic text-brass-300">Insights</span>
        </h1>
        <p className="mt-1 text-sm text-cream-400">The story of your reading life, told in pages and patterns.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { icon: BookCheck, label: "Finished all-time", value: formatNumber(stats.finished), tint: "text-sage-300 border-sage-500/30 bg-sage-500/10" },
          { icon: Footprints, label: "Pages tracked", value: formatNumber(pagesShown), tint: "text-brass-300 border-brass-500/30 bg-brass-500/10" },
          { icon: Gauge, label: "Pages / day average", value: formatNumber(avgPerDay), tint: "text-denim-300 border-denim-500/30 bg-denim-500/10" },
          { icon: Flame, label: "Current streak", value: `${stats.streak} day${stats.streak === 1 ? "" : "s"}`, tint: "text-wine-300 border-wine-500/30 bg-wine-500/10" },
        ].map((s, i) => (
          <div key={s.label} className={cx(CARD, "p-5 animate-fade-up")} style={{ animationDelay: `${i * 50}ms` }}>
            <span className={cx("flex h-9 w-9 items-center justify-center rounded-xl border", s.tint)}>
              <s.icon className="h-[17px] w-[17px]" />
            </span>
            <p className="mt-3.5 font-display text-[26px] font-semibold leading-none tabular-nums text-cream-50">
              {s.value}
            </p>
            <p className="mt-1.5 text-[11.5px] font-medium text-cream-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className={cx(CARD, "p-6 animate-fade-up")} style={{ animationDelay: "180ms" }}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold text-cream-50">
            <BarChart3 className="h-4 w-4 text-brass-300" /> The last twelve months
          </h2>
          <div className="flex rounded-xl border border-ink-600 bg-ink-850 p-1">
            {(["books", "pages"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cx(
                  "rounded-lg px-3 py-1.5 text-[12px] font-semibold capitalize transition",
                  mode === m ? "bg-ink-700 text-cream-50" : "text-cream-400 hover:text-cream-100"
                )}
              >
                {m === "books" ? "Books finished" : "Pages read"}
              </button>
            ))}
          </div>
        </div>
        <BigBars monthly={stats.monthly} mode={mode} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className={cx(CARD, "p-6 animate-fade-up lg:col-span-3")} style={{ animationDelay: "240ms" }}>
          <h2 className="mb-5 flex items-center gap-2.5 font-display text-lg font-semibold text-cream-50">
            <CalendarDays className="h-4 w-4 text-brass-300" /> Reading heatmap — last 26 weeks
          </h2>
          <Heatmap data={stats.heatmap} />
          <p className="mt-4 border-t border-ink-700 pt-3 text-[11.5px] text-cream-500">
            Every square is a day; brighter brass means more pages logged that day.
          </p>
        </div>
        <div className={cx(CARD, "p-6 animate-fade-up lg:col-span-2")} style={{ animationDelay: "300ms" }}>
          <h2 className="mb-5 flex items-center gap-2.5 font-display text-lg font-semibold text-cream-50">
            <CakeSlice className="h-4 w-4 text-brass-300" /> Shelf by genre
          </h2>
          {stats.genres.length === 0 ? (
            <p className="py-10 text-center text-[13px] italic text-cream-500">
              Add a few books and your taste profile will appear here.
            </p>
          ) : (
            <Donut genres={stats.genres} />
          )}
        </div>
      </div>
    </div>
  );
}
