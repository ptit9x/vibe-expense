export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3 animate-pulse">
      <div className="w-10 h-10 rounded-xl clay-inset shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 clay-inset rounded-full w-3/4" />
        <div className="h-2.5 clay-inset rounded-full w-1/2" />
      </div>
      <div className="h-4 clay-inset rounded-full w-16" />
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="clay-card rounded-3xl p-4 space-y-4 animate-pulse">
      <div className="h-4 clay-inset rounded-full w-1/3" />
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
    </div>
  )
}
