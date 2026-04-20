import type { ReactNode } from "react";

type ShareCardProps = {
  eyebrow: string;
  title: string;
  context?: string;
  children: ReactNode;
};

export function ShareCard({ eyebrow, title, context, children }: ShareCardProps) {
  return (
    <div className="w-[720px] overflow-hidden border border-white/10 bg-[#070c14] p-6 text-white shadow-[0_30px_90px_rgba(0,0,0,0.42)]">
      <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-4">
        <div>
          <div className="mb-label text-cyan-200">{eyebrow}</div>
          <div className="mb-title mt-2 text-6xl text-white">{title}</div>
          {context ? <div className="mt-2 text-sm text-slate-400">{context}</div> : null}
        </div>
        <div className="font-['Bebas_Neue'] text-3xl tracking-[0.16em] text-emerald-300">
          Money<span className="text-white">Ballr</span>
        </div>
      </div>
      <div className="pt-5">{children}</div>
      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-500">
        <span>Baseball analytics snapshot</span>
        <span>{new Date().toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span>
      </div>
    </div>
  );
}
