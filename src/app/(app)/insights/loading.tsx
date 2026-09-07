import { Skeleton } from "@/components/ui";

export default function InsightsLoading() {
  return (
    <div className="flex flex-col gap-7">
      <Skeleton className="h-10 w-72" />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-80" />
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-64 lg:col-span-3" />
        <Skeleton className="h-64 lg:col-span-2" />
      </div>
    </div>
  );
}
