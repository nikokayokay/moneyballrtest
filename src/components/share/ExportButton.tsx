import { Download, ImageDown } from "lucide-react";
import { useRef, useState } from "react";
import { copyElementImage, downloadElementImage, safeFilename } from "@/src/lib/export-image";

type ExportButtonProps = {
  targetRef: React.RefObject<HTMLElement | null>;
  filename: string;
  caption?: string;
};

export function ExportButton({ targetRef, filename, caption }: ExportButtonProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const show = (text: string) => {
    setMessage(text);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setMessage(null), 2200);
  };

  const run = async (mode: "download" | "copy") => {
    if (!targetRef.current) return;
    setBusy(true);
    try {
      if (mode === "copy") {
        const copied = await copyElementImage(targetRef.current);
        if (copied) {
          if (caption) await navigator.clipboard.writeText(caption);
          show("Copied");
        } else {
          await downloadElementImage(targetRef.current, `${safeFilename(filename)}.png`);
          show("Downloaded");
        }
      } else {
        await downloadElementImage(targetRef.current, `${safeFilename(filename)}.png`);
        show("Downloaded");
      }
    } catch {
      show("Export failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2" data-export-hidden="true">
      <button
        type="button"
        disabled={busy}
        onClick={() => run("download")}
        className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.03] px-2.5 py-1.5 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.14em] text-slate-300 transition hover:border-emerald-300/30 hover:text-white disabled:opacity-50"
      >
        <Download className="h-3.5 w-3.5" />
        Export
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => run("copy")}
        className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.03] px-2.5 py-1.5 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.14em] text-slate-300 transition hover:border-cyan-300/30 hover:text-white disabled:opacity-50"
      >
        <ImageDown className="h-3.5 w-3.5" />
        Copy
      </button>
      {message ? <span className="text-xs text-slate-500">{message}</span> : null}
    </div>
  );
}
