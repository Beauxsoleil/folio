"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cx } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; message: string };

const ToastContext = createContext<{ push: (kind: ToastKind, message: string) => void }>({
  push: () => {},
});

export const useToast = () => useContext(ToastContext);

const ICONS: Record<ToastKind, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-sage-300" />,
  error: <XCircle className="h-4 w-4 text-wine-300" />,
  info: <Info className="h-4 w-4 text-brass-300" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(92vw,340px)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cx(
              "pointer-events-auto flex items-center gap-2.5 rounded-xl border border-ink-600 bg-ink-800/95 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur animate-toast-in"
            )}
          >
            {ICONS[t.kind]}
            <p className="flex-1 text-[13px] font-medium text-cream-100">{t.message}</p>
            <button
              onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))}
              className="rounded-md p-1 text-cream-500 transition hover:bg-ink-700 hover:text-cream-200"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
