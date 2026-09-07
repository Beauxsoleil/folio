import { Skeleton } from "@/components/ui";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-3 h-10 w-80" />
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-72" />
        <Skeleton className="h-72 lg:col-span-2" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
