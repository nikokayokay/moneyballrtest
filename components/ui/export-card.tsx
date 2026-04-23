import { useRef, useState, type ReactNode } from "react";
import html2canvas from "html2canvas";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

type ExportRatio = "16:9" | "1:1";

export function ExportCard({ title, filename, children, className }: { title?: string; filename: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [ratio, setRatio] = useState<ExportRatio>("16:9");
  const [busy, setBusy] = useState(false);

  const exportImage = async () => {
    if (!ref.current) return;
    setBusy(true);
    try {
      const canvas = await html2canvas(ref.current, {
        backgroundColor: "#050914",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `${filename}-${ratio.replace(":", "x")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={cn("rounded-3xl border border-white/10 bg-[#070d16] p-3", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">{title || "Export module"}</div>
        <div className="flex items-center gap-2">
          {(["16:9", "1:1"] as ExportRatio[]).map((item) => (
            <button key={item} type="button" onClick={() => setRatio(item)} className={cn("rounded-full border px-2 py-1 text-[10px]", ratio === item ? "border-cyan-300/30 text-cyan-200" : "border-white/8 text-slate-500")}>{item}</button>
          ))}
          <button type="button" disabled={busy} onClick={exportImage} className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.14em] text-emerald-200 disabled:opacity-50">
            <Download className="h-3.5 w-3.5" />
            Export as Image
          </button>
        </div>
      </div>
      <div ref={ref} className={cn("overflow-hidden rounded-2xl bg-[#050914] p-4", ratio === "16:9" ? "aspect-video" : "aspect-square")}>
        {children}
      </div>
    </section>
  );
}
