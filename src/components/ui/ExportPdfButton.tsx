"use client";

import { useEffect, useRef, useState } from "react";
import type { jsPDF } from "jspdf";

/** A report the PDF can be downloaded as: adds a branded cover page before the page content. */
export type PdfReport = {
  key: string;
  /** menu entry, e.g. "Weekly report" */
  label: string;
  /** cover title, e.g. "India Cotton Weekly Report" */
  title: string;
  /** cover date line, e.g. "14 October 2026" */
  dateLine: string;
  fileName: string;
};

const COMPANY = "Agrolytix Research";
const LOGO_SRC = "/agrolytix-logo.jpg";
const BRAND_GREEN = "#558b3d"; // the logo's green

async function loadImage(src: string): Promise<{ data: string; w: number; h: number }> {
  const blob = await (await fetch(src)).blob();
  const data = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Could not load the logo"));
    r.readAsDataURL(blob);
  });
  const img = new Image();
  img.src = data;
  await img.decode();
  return { data, w: img.naturalWidth, h: img.naturalHeight };
}

/** White, letterhead-style first page (white in both themes — the logo has a white background). */
async function drawCover(pdf: jsPDF, report: PdfReport) {
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const cx = pageW / 2;

  pdf.setFillColor("#ffffff");
  pdf.rect(0, 0, pageW, pageH, "F");
  pdf.setFillColor(BRAND_GREEN);
  pdf.rect(0, 0, pageW, 10, "F");
  pdf.rect(0, pageH - 10, pageW, 10, "F");

  const logo = await loadImage(LOGO_SRC);
  const logoW = pageW * 0.62;
  const logoH = (logoW * logo.h) / logo.w;
  pdf.addImage(logo.data, "JPEG", cx - logoW / 2, 150, logoW, logoH);

  let y = 150 + logoH + 60;
  pdf.setDrawColor(BRAND_GREEN);
  pdf.setLineWidth(1.5);
  pdf.line(cx - 60, y, cx + 60, y);

  y += 70;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(28);
  pdf.setTextColor("#191b18");
  for (const line of pdf.splitTextToSize(report.title, pageW - 120) as string[]) {
    pdf.text(line, cx, y, { align: "center" });
    y += 36;
  }

  y += 6;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(15);
  pdf.setTextColor(BRAND_GREEN);
  pdf.text(report.dateLine, cx, y, { align: "center" });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor("#191b18");
  pdf.text(COMPANY, cx, pageH - 70, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor("#8f9389");
  pdf.text("India Cotton Market Intelligence", cx, pageH - 54, { align: "center" });
}

/**
 * Downloads the current page as a PDF that looks exactly like the screen: the page content
 * is rendered to an image (html2canvas-pro — same layout, theme, colours and charts) and laid
 * out on A4 pages by jsPDF. Page breaks are placed between cards (`.panel`) so no card is cut
 * in half. Controls marked `.print-hide` (buttons, nav) are left out.
 * With `reports`, the button opens a menu of report types, each adding its own cover page.
 */
export function ExportPdfButton({
  fileName,
  className,
  reports,
}: {
  fileName: string;
  className?: string;
  reports?: PdfReport[];
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function exportPdf(report?: PdfReport) {
    setMenuOpen(false);
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

      let first = true;
      if (report) {
        await drawCover(pdf, report);
        first = false;
      }

      let y = 0;
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

      pdf.save(`${report?.fileName ?? fileName}.pdf`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span ref={menuRef} className="print-hide relative inline-flex items-center gap-2">
      <button
        type="button"
        onClick={() => (reports?.length ? setMenuOpen((o) => !o) : exportPdf())}
        disabled={busy}
        aria-haspopup={reports?.length ? "menu" : undefined}
        aria-expanded={reports?.length ? menuOpen : undefined}
        title="Download this page as a PDF"
        className={
          className ??
          "focusable rounded-xl border border-line px-4 py-2.5 text-[12.5px] font-semibold text-ink transition-colors hover:bg-surface-2 disabled:opacity-50"
        }
      >
        {busy ? "Preparing PDF…" : reports?.length ? "⤓ Download PDF ▾" : "⤓ Download PDF"}
      </button>
      {menuOpen && reports?.length ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-1.5 min-w-[220px] overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg"
        >
          {reports.map((r) => (
            <button
              key={r.key}
              type="button"
              role="menuitem"
              onClick={() => exportPdf(r)}
              className="focusable block w-full px-3.5 py-2 text-left hover:bg-surface-2"
            >
              <div className="text-[12.5px] font-semibold text-ink">{r.label}</div>
              <div className="text-[10.5px] text-ink-faint">
                {r.title} · {r.dateLine}
              </div>
            </button>
          ))}
        </div>
      ) : null}
      {error ? <span className="text-[11px] text-neg">⚠ {error}</span> : null}
    </span>
  );
}
