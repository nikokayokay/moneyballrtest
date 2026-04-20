import type { ReactNode } from "react";

type HeatmapContainerProps = {
  title: string;
  meta?: string;
  children: ReactNode;
};

export function HeatmapContainer({ title, meta, children }: HeatmapContainerProps) {
  return (
    <section className="bg-[#090f19]">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div className="font-['Bebas_Neue'] text-[clamp(1.8rem,2.4vw,2.6rem)] tracking-[0.06em] text-white">{title}</div>
        {meta ? <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-slate-500">{meta}</div> : null}
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </section>
  );
}
