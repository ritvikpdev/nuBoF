import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-muted/30">
      <div className="max-w-xl mx-auto px-4 py-6 pb-6 sm:pb-28 space-y-4">

        {/* Header */}
        <div className="pb-2 space-y-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-40" />
        </div>

        {/* Calories card */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <Skeleton className="h-3 w-16" />
          <div className="flex items-end justify-between">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-4 w-36" />
        </div>

        {/* Macros card */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-5">
          <Skeleton className="h-3 w-14" />
          <div className="flex justify-center">
            <Skeleton className="h-[180px] w-[180px] rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Micronutrients card */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
          <Skeleton className="h-3 w-28" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>

        {/* Water card */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-32" />
            </div>
            <Skeleton className="h-10 w-10 rounded-2xl" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-7 w-16 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Meals card */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-1">
          <Skeleton className="h-3 w-20 mb-4" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 py-3.5 border-t border-border first:border-t-0">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-5 w-14 flex-shrink-0" />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
