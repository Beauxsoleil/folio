import { redirect } from "next/navigation";
import { LibraryBig } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-dvh bg-ink-950">
      {/* brand panel */}
      <div className="relative hidden w-[46%] overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.pexels.com/photos/2767814/pexels-photo-2767814.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1600&w=1100"
          alt="Warm bookshelf in a dark library"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/45 to-ink-950/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-ink-950/70" />

        <div className="relative flex h-full flex-col justify-between p-10">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-brass-300 to-brass-600 shadow-lg">
              <LibraryBig className="h-5 w-5 text-ink-950" strokeWidth={2.2} />
            </span>
            <span className="font-display text-2xl font-semibold italic text-cream-50">Folio</span>
          </div>

          <div className="max-w-md">
            <blockquote className="font-display text-[26px] font-medium leading-snug text-cream-50">
              “A reader lives a thousand lives before he dies. The man who never reads lives
              only one.”
            </blockquote>
            <p className="mt-3 text-sm font-medium tracking-wide text-cream-300">
              — George R.R. Martin
            </p>
            <div className="mt-8 flex gap-6 text-[11px] font-medium uppercase tracking-[0.18em] text-cream-400">
              <span>Track every page</span>
              <span>·</span>
              <span>Shelve in 3D</span>
              <span>·</span>
              <span>Read with intent</span>
            </div>
          </div>
        </div>
      </div>

      {/* form panel */}
      <div className="relative flex flex-1 items-center justify-center px-5 py-12 sm:px-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(90% 70% at 70% 10%, rgba(217,172,93,0.07), transparent 60%)",
          }}
        />
        <div className="relative w-full max-w-md animate-fade-up">{children}</div>
      </div>
    </div>
  );
}
