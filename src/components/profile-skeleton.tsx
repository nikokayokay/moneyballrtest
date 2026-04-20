export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="surface-primary p-4 sm:p-5">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.95fr_1fr]">
          <div className="h-52 animate-pulse border border-white/8 bg-white/[0.05]" />
          <div className="h-52 animate-pulse border border-white/8 bg-white/[0.05]" />
          <div className="h-52 animate-pulse border border-white/8 bg-white/[0.05]" />
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-96 animate-pulse border border-white/8 bg-white/[0.05]" />
        <div className="h-96 animate-pulse border border-white/8 bg-white/[0.05]" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-80 animate-pulse border border-white/8 bg-white/[0.05]" />
        <div className="h-80 animate-pulse border border-white/8 bg-white/[0.05]" />
      </div>
      <div className="h-96 animate-pulse border border-white/8 bg-white/[0.05]" />
    </div>
  );
}
