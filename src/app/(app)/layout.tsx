import { redirect } from "next/navigation";
import { getCurrentUser, toUserDTO } from "@/lib/auth";
import { countBooks } from "@/lib/queries";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const bookCount = await countBooks(user.id);
  return (
    <AppShell user={toUserDTO(user)} bookCount={bookCount}>
      {children}
    </AppShell>
  );
}
