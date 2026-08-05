import { SkeletonCard } from "@/components/shared/states";

export default function AppLoading() {
  return (
    <div className="space-y-4 p-1" aria-busy="true" aria-label="Loading">
      <SkeletonCard className="h-36" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SkeletonCard className="h-28" />
        <SkeletonCard className="h-28" />
        <SkeletonCard className="h-28" />
        <SkeletonCard className="h-28" />
      </div>
      <SkeletonCard className="h-64" />
    </div>
  );
}
