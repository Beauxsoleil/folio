"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Save, Target, UserRound } from "lucide-react";
import { api } from "@/lib/client";
import type { UserDTO } from "@/lib/types";
import { initials } from "@/lib/utils";
import { Button, Field, Input } from "@/components/ui";
import { useToast } from "@/components/toast";

const CARD =
  "rounded-2xl border border-ink-700 bg-ink-900/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]";

export function SettingsView({ user }: { user: UserDTO }) {
  const [name, setName] = useState(user.name);
  const [goal, setGoal] = useState(String(user.readingGoal));
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const dirty = name.trim() !== user.name || +goal !== user.readingGoal;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim(), readingGoal: +goal }),
      });
      toast.push("success", "Settings saved");
      router.refresh();
    } catch (err) {
      toast.push("error", err instanceof Error ? err.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    setSigningOut(true);
    try {
      await api("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="flex flex-col gap-7">
      <div className="animate-fade-up">
        <h1 className="font-display text-[34px] font-semibold leading-tight tracking-tight text-cream-50 sm:text-[40px]">
          Reader <span className="italic text-brass-300">Settings</span>
        </h1>
        <p className="mt-1 text-sm text-cream-400">Tune the library to your reading life.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* profile card */}
        <div className={`${CARD} p-6 animate-fade-up`} style={{ animationDelay: "60ms" }}>
          <h2 className="mb-5 flex items-center gap-2.5 font-display text-lg font-semibold text-cream-50">
            <UserRound className="h-4 w-4 text-brass-300" /> Profile
          </h2>
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-ink-500 to-ink-700 font-display text-2xl font-semibold text-cream-100">
              {initials(name || user.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-cream-100">{user.name}</p>
              <p className="truncate text-[12.5px] text-cream-500">{user.email}</p>
              <p className="mt-1 text-[11px] text-cream-600">
                Reader since{" "}
                {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* preferences */}
        <form onSubmit={save} className={`${CARD} p-6 animate-fade-up lg:col-span-2`} style={{ animationDelay: "120ms" }}>
          <h2 className="mb-5 flex items-center gap-2.5 font-display text-lg font-semibold text-cream-50">
            <Target className="h-4 w-4 text-brass-300" /> Reading preferences
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Display name">
              <Input value={name} onChange={(e) => setName(e.target.value)} minLength={2} required />
            </Field>
            <Field label={`${new Date().getFullYear()} reading goal`} hint="How many books do you want to finish this year?">
              <Input type="number" min={1} max={500} value={goal} onChange={(e) => setGoal(e.target.value)} required />
            </Field>
          </div>
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-ink-700 pt-4">
            <p className="text-[12px] text-cream-600">
              Cover art courtesy of the Open Library catalog.
            </p>
            <Button type="submit" loading={saving} disabled={!dirty}>
              <Save className="h-4 w-4" /> Save changes
            </Button>
          </div>
        </form>
      </div>

      <div className={`${CARD} flex flex-wrap items-center justify-between gap-4 p-6 animate-fade-up`} style={{ animationDelay: "180ms" }}>
        <div>
          <h2 className="font-display text-lg font-semibold text-cream-50">Leave the library</h2>
          <p className="mt-0.5 text-[12.5px] text-cream-500">
            Your books stay safely shelved for next time.
          </p>
        </div>
        <Button variant="danger" onClick={signOut} loading={signingOut}>
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}
