"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpenCheck, Eye, EyeOff, LibraryBig, Sparkles } from "lucide-react";
import { api } from "@/lib/client";
import { Button, Field, Input } from "@/components/ui";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isLogin = mode === "login";
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"form" | "demo" | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending("form");
    try {
      await api(`/api/auth/${isLogin ? "login" : "signup"}`, {
        method: "POST",
        body: JSON.stringify(isLogin ? { email, password } : { name, email, password }),
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPending(null);
    }
  };

  const enterDemo = async () => {
    setError(null);
    setPending("demo");
    try {
      await api("/api/auth/login", { method: "POST", body: JSON.stringify({ demo: true }) });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPending(null);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center gap-3 lg:hidden">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-brass-300 to-brass-600">
          <LibraryBig className="h-5 w-5 text-ink-950" strokeWidth={2.2} />
        </span>
        <span className="font-display text-2xl font-semibold italic text-cream-50">Folio</span>
      </div>

      <h1 className="font-display text-[34px] font-semibold leading-tight tracking-tight text-cream-50">
        {isLogin ? "Welcome back, reader." : "Begin your collection."}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-cream-400">
        {isLogin
          ? "Your shelves have been kept warm. Sign in to continue the story."
          : "One account for every book you own, borrow, and dream about."}
      </p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        {!isLogin && (
          <Field label="Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Avery Quinn"
              autoComplete="name"
              required
              minLength={2}
            />
          </Field>
        )}
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </Field>
        <Field label="Password" hint={isLogin ? undefined : "At least 8 characters."}>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
              minLength={8}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-500 transition hover:text-cream-200"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        {error && (
          <p className="rounded-xl border border-wine-500/40 bg-wine-500/10 px-3.5 py-2.5 text-[13px] font-medium text-wine-200 animate-pop-in">
            {error}
          </p>
        )}

        <Button type="submit" loading={pending === "form"} className="mt-1 w-full py-3">
          <BookOpenCheck className="h-4 w-4" />
          {isLogin ? "Enter the library" : "Create my shelves"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-ink-700" />
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-cream-600">or</span>
        <div className="h-px flex-1 bg-ink-700" />
      </div>

      <Button variant="secondary" onClick={enterDemo} loading={pending === "demo"} className="w-full py-3">
        <Sparkles className="h-4 w-4 text-brass-300" />
        Browse the demo shelf
      </Button>
      <p className="mt-2.5 text-center text-[11.5px] text-cream-600">
        Instant access — a fully stocked library with 22 books and real cover art.
      </p>

      <p className="mt-8 text-center text-[13px] text-cream-400">
        {isLogin ? "New here? " : "Already shelving? "}
        <Link
          href={isLogin ? "/signup" : "/login"}
          className="font-semibold text-brass-300 underline-offset-4 transition hover:text-brass-200 hover:underline"
        >
          {isLogin ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}
