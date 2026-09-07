import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { computeStats, listBooks, listLogs, serializeBook, sumPagesTracked } from "@/lib/queries";
import { DashboardView } from "@/components/dashboard-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [all, logs, pagesTracked] = await Promise.all([
    listBooks(user.id),
    listLogs(user.id),
    sumPagesTracked(user.id),
  ]);
  const stats = computeStats(all, logs, user.readingGoal, pagesTracked);
  const books = all.map(serializeBook);

  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Burning the midnight oil" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return <DashboardView user={user.name.split(" ")[0]} greeting={greeting} stats={stats} books={books} />;
}
