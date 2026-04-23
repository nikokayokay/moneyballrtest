import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DashboardLayoutProps = {
  left: ReactNode;
  children: ReactNode;
  className?: string;
};

export function DashboardLayout({ left, children, className }: DashboardLayoutProps) {
  return (
    <div className={cn("flex min-h-screen w-full bg-[#03060d] text-white", className)}>
      <aside className="hidden w-[320px] shrink-0 border-r border-white/10 bg-[#060a12]/95 xl:block">
        <div className="sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto scrollbar-thin">{left}</div>
      </aside>
      <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
