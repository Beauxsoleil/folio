export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatDate(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatShortDate(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}

export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Deterministic 0..1 pseudo-random from a string (stable layout variance). */
export function seededUnit(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

const COVER_PALETTES: Array<[string, string, string]> = [
  ["#2f2118", "#5c3a22", "#e8c98f"],
  ["#1c2a33", "#33545f", "#bfe0dd"],
  ["#2e1f2e", "#553a52", "#eec9d8"],
  ["#20301f", "#3f5c38", "#d3e6b6"],
  ["#301d1c", "#603230", "#f3c6b8"],
  ["#22253a", "#41477a", "#c3cdf3"],
  ["#332a17", "#6b5426", "#f0da9e"],
  ["#1f2f2b", "#38604f", "#bfe8cf"],
];

/** Colors for the typographic fallback cover, derived from the title. */
export function coverPalette(title: string): [string, string, string] {
  const idx = Math.floor(seededUnit(title) * COVER_PALETTES.length) % COVER_PALETTES.length;
  return COVER_PALETTES[idx];
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
