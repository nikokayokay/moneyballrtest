import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export function PageShell({ children, className = "" }: PageShellProps) {
  return (
    <main className={`mb-shell py-4 sm:py-5 lg:py-6 ${className}`}>
      {children}
    </main>
  );
}

export function SectionHeader({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return (
    <div className="flex flex-col gap-2 border-b border-white/8 px-4 py-3 sm:px-5">
      <div className="mb-label text-cyan-200">{eyebrow}</div>
      <div className="mb-title text-[clamp(2.1rem,3.5vw,4rem)] text-white">{title}</div>
      {copy ? <p className="max-w-3xl text-sm leading-6 text-slate-400">{copy}</p> : null}
    </div>
  );
}
