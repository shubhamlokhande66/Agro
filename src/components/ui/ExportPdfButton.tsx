"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Saves the current page as a PDF through the browser's print dialog ("Save as PDF").
 * Before printing it switches to the light theme and adds `html.printing`, which lays the
 * page out at A4-landscape width with the sidebar / top bar / controls hidden (see the
 * print rules in globals.css) — Chart.js canvases only redraw on a real resize, so the
 * layout has to change on screen first. Everything is restored after the dialog closes.
 */
export function ExportPdfButton({ fileName, className }: { fileName: string; className?: string }) {
  const { mode, setMode } = useTheme();
  const [busy, setBusy] = useState(false);

  async function exportPdf() {
    setBusy(true);
    const prevMode = mode;
    const prevTitle = document.title;
    const root = document.documentElement;

    // the print dialog suggests document.title as the PDF's file name
    document.title = fileName;
    if (prevMode === "dark") setMode("light");
    root.classList.add("printing");
    window.scrollTo(0, 0);
    await wait(600); // charts redraw at the new width + theme

    const restore = () => {
      window.removeEventListener("afterprint", restore);
      root.classList.remove("printing");
      document.title = prevTitle;
      if (prevMode === "dark") setMode("dark");
      setBusy(false);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  }

  return (
    <button
      type="button"
      onClick={exportPdf}
      disabled={busy}
      title="Download this page as a PDF (choose “Save as PDF” in the print dialog)"
      className={
        className ??
        "focusable print-hide rounded-xl border border-line px-4 py-2.5 text-[12.5px] font-semibold text-ink transition-colors hover:bg-surface-2 disabled:opacity-50"
      }
    >
      {busy ? "Preparing PDF…" : "⤓ Download PDF"}
    </button>
  );
}
