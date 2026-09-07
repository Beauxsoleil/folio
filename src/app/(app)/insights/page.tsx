import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { computeStats, listBooks, listLogs, sumPagesTracked } from "@/lib/queries";
import { InsightsView } from "@/components/insights-view";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [all, logs, pagesTracked] = await Promise.all([
    listBooks(user.id),
    listLogs(user.id),
    sumPagesTracked(user.id),
  ]);
  const stats = computeStats(all, logs, user.readingGoal, pagesTracked);
  return <InsightsView stats={stats} />;
}
