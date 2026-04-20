export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="panel-glow rounded-[34px] border border-white/8 bg-white/[0.04] p-6">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.95fr_1fr]">
          <div className="h-52 animate-pulse rounded-[28px] border border-white/8 bg-white/[0.05]" />
          <div className="h-52 animate-pulse rounded-[28px] border border-white/8 bg-white/[0.05]" />
          <div className="h-52 animate-pulse rounded-[28px] border border-white/8 bg-white/[0.05]" />
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-96 animate-pulse rounded-[28px] border border-white/8 bg-white/[0.05]" />
        <div className="h-96 animate-pulse rounded-[28px] border border-white/8 bg-white/[0.05]" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-80 animate-pulse rounded-[28px] border border-white/8 bg-white/[0.05]" />
        <div className="h-80 animate-pulse rounded-[28px] border border-white/8 bg-white/[0.05]" />
      </div>
      <div className="h-96 animate-pulse rounded-[28px] border border-white/8 bg-white/[0.05]" />
    </div>
  );
}
