"use client";

import { useEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Loader2, Star, X } from "lucide-react";
import { cx } from "@/lib/utils";

/* ---------------- Button ---------------- */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
};

export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-400 disabled:cursor-not-allowed disabled:opacity-55",
        size === "sm" ? "px-3 py-1.5 text-[12.5px]" : "px-4 py-2.5 text-sm",
        variant === "primary" &&
          "bg-gradient-to-b from-brass-300 to-brass-500 text-ink-950 shadow-[inset_0_1px_0_rgba(255,244,214,.65),0_8px_18px_-8px_rgba(198,144,63,.7)] hover:brightness-110 active:brightness-95",
        variant === "secondary" &&
          "border border-ink-600 bg-ink-750 text-cream-100 hover:border-ink-500 hover:bg-ink-700",
        variant === "ghost" && "text-cream-300 hover:bg-ink-750 hover:text-cream-100",
        variant === "danger" && "border border-wine-500/40 bg-wine-500/10 text-wine-200 hover:bg-wine-500/20",
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

/* ---------------- Inputs ---------------- */
export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        "w-full rounded-xl border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-sm text-cream-100 placeholder:text-cream-600 transition focus:border-brass-500/60 focus:outline-none focus:ring-2 focus:ring-brass-500/20",
        className
      )}
      {...rest}
    />
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cx(
        "w-full resize-none rounded-xl border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-sm text-cream-100 placeholder:text-cream-600 transition focus:border-brass-500/60 focus:outline-none focus:ring-2 focus:ring-brass-500/20",
        className
      )}
      {...rest}
    />
  );
}

export function Select({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cx(
        "fol-select w-full cursor-pointer rounded-xl border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-sm text-cream-100 transition focus:border-brass-500/60 focus:outline-none focus:ring-2 focus:ring-brass-500/20",
        className
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-cream-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-cream-600">{hint}</span>}
    </label>
  );
}

/* ---------------- Modal ---------------- */
export function Modal({
  open,
  onClose,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-ink-950/75 backdrop-blur-sm animate-pop-in" onClick={onClose} />
      <div
        className={cx(
          "relative w-full max-w-lg overflow-hidden rounded-t-2xl border border-ink-600 bg-ink-850 shadow-2xl shadow-black/60 animate-pop-in sm:rounded-2xl",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------------- Drawer (slide-over) ---------------- */
export function Drawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-ink-600 bg-ink-900 shadow-2xl shadow-black/60 animate-drawer-in">
        <button
          onClick={onClose}
          className="absolute left-4 top-4 z-10 rounded-lg border border-ink-600 bg-ink-800/90 p-2 text-cream-300 backdrop-blur transition hover:text-cream-100"
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

/* ---------------- Stars ---------------- */
export function Stars({
  value,
  onChange,
  size = 16,
  className,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  className?: string;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div className={cx("inline-flex items-center gap-0.5", className)} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(i === value ? 0 : i)}
          onMouseEnter={() => onChange && setHover(i)}
          className={cx("rounded transition", onChange ? "cursor-pointer hover:scale-125" : "cursor-default")}
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
        >
          <Star
            size={size}
            className={cx(
              "transition-colors",
              i <= display ? "fill-brass-400 text-brass-400" : "fill-transparent text-ink-500"
            )}
          />
        </button>
      ))}
    </div>
  );
}

/* ---------------- Progress bar ---------------- */
export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cx("h-1.5 w-full overflow-hidden rounded-full bg-ink-700", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-brass-500 to-brass-300 transition-[width] duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/* ---------------- Skeleton ---------------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton rounded-xl", className)} />;
}

/* ---------------- Empty state ---------------- */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-600 bg-ink-900/50 px-8 py-14 text-center animate-fade-up",
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-600 bg-ink-800 text-brass-300 shadow-inner">
        {icon}
      </div>
      <h3 className="font-display text-lg font-semibold text-cream-100">{title}</h3>
      <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-cream-400">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------------- Debounce hook ---------------- */
export function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setV(value), delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, delay]);
  return v;
}

/* ---------------- Count-up hook ---------------- */
export function useCountUp(target: number, duration = 1100): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}
