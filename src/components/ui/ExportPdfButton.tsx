"use client";

import { useState } from "react";

/**
 * Downloads the current page as a PDF that looks exactly like the screen: the page content
 * is rendered to an image (html2canvas-pro — same layout, theme, colours and charts) and laid
 * out on A4 pages by jsPDF. Page breaks are placed between cards (`.panel`) so no card is cut
 * in half. Controls marked `.print-hide` (buttons, nav) are left out.
 */
export function ExportPdfButton({ fileName, className }: { fileName: string; className?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exportPdf() {
    setBusy(true);
    setError(null);
    try {
      const target = document.querySelector<HTMLElement>(".print-page") ?? document.body;
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);

      const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#ffffff";
      const box = target.getBoundingClientRect();
      const canvas = await html2canvas(target, {
        scale: 2,
        backgroundColor: bg,
        useCORS: true,
        logging: false,
        windowWidth: document.documentElement.clientWidth,
        ignoreElements: (el) => el.classList?.contains("print-hide") ?? false,
        // the cloned page replays CSS animations from their first frame — e.g. the page's
        // fade-in (`animate-rise`, opacity 0 → 1) — which captured the content washed out
        onclone: (doc) => {
          const style = doc.createElement("style");
          style.textContent =
            "*,*::before,*::after{animation:none!important;transition:none!important}.animate-rise{opacity:1!important;transform:none!important}";
          doc.head.appendChild(style);
        },
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4", compress: true });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 18;
      const ptPerPx = (pageW - margin * 2) / canvas.width; // canvas px → PDF points
      const sliceH = Math.floor((pageH - margin * 2) / ptPerPx); // canvas px that fit on one page
      const ratio = canvas.width / box.width; // CSS px → canvas px

      // where a page may break: just below each card
      const breaks = Array.from(target.querySelectorAll<HTMLElement>(".panel"))
        .map((el) => Math.round((el.getBoundingClientRect().bottom - box.top + 6) * ratio))
        .filter((b) => b > 0 && b < canvas.height)
        .sort((a, b) => a - b);

      let y = 0;
      let first = true;
      while (y < canvas.height - 2) {
        let end = Math.min(y + sliceH, canvas.height);
        if (end < canvas.height) {
          // prefer the lowest card edge on this page, as long as it uses at least 40% of it
          const cut = breaks.filter((b) => b > y + sliceH * 0.4 && b <= end).pop();
          if (cut) end = cut;
        }
        const part = document.createElement("canvas");
        part.width = canvas.width;
        part.height = end - y;
        const ctx = part.getContext("2d")!;
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, part.width, part.height);
        ctx.drawImage(canvas, 0, y, canvas.width, part.height, 0, 0, canvas.width, part.height);

        if (!first) pdf.addPage();
        first = false;
        pdf.setFillColor(bg);
        pdf.rect(0, 0, pageW, pageH, "F");
        pdf.addImage(part.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, pageW - margin * 2, part.height * ptPerPx);
        y = end;
      }

      pdf.save(`${fileName}.pdf`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="print-hide inline-flex items-center gap-2">
      <button
        type="button"
        onClick={exportPdf}
        disabled={busy}
        title="Download this page as a PDF"
        className={
          className ??
          "focusable rounded-xl border border-line px-4 py-2.5 text-[12.5px] font-semibold text-ink transition-colors hover:bg-surface-2 disabled:opacity-50"
        }
      >
        {busy ? "Preparing PDF…" : "⤓ Download PDF"}
      </button>
      {error ? <span className="text-[11px] text-neg">⚠ {error}</span> : null}
    </span>
  );
}
