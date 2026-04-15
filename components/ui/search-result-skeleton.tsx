export function SearchResultSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="bg-card rounded-2xl border border-border p-4 animate-pulse"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="h-4 bg-muted rounded-md w-2/3 mb-3" />
          <div className="flex gap-4">
            <div className="h-3 bg-muted rounded w-14" />
            <div className="h-3 bg-muted rounded w-14" />
            <div className="h-3 bg-muted rounded w-14" />
          </div>
        </div>
      ))}
    </div>
  );
}
