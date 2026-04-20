import { toBlob, toPng } from "html-to-image";

export type ExportVariant = "compact" | "detailed";
export type ExportTheme = "dark" | "light";

export async function downloadElementImage(element: HTMLElement, filename: string) {
  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: "#070c14",
    filter: (node) => !(node instanceof HTMLElement && node.dataset.exportHidden === "true"),
  });
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export async function copyElementImage(element: HTMLElement) {
  if (!navigator.clipboard || !("ClipboardItem" in window)) return false;
  const blob = await toBlob(element, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: "#070c14",
    filter: (node) => !(node instanceof HTMLElement && node.dataset.exportHidden === "true"),
  });
  if (!blob) return false;
  await navigator.clipboard.write([
    new ClipboardItem({ [blob.type]: blob }),
  ]);
  return true;
}

export function safeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "moneyballr-card";
}
