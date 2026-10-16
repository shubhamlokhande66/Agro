"use client";

import { useEffect, useRef, useState } from "react";
import type { jsPDF } from "jspdf";

/** A report the PDF can be downloaded as: adds a branded cover page before the page content. */
export type PdfReport = {
  key: string;
  /** menu entry, e.g. "Weekly report" */
  label: string;
  /** cover title, e.g. "INDIA COTTON: Weekly Report" (the part before ":" is set large) */
  title: string;
  /** cover date line, e.g. "16.10.2026" */
  dateLine: string;
  fileName: string;
  /** "Inside this report" list on the cover */
  contents?: string[];
  /** field photographs for the cover (same-origin URLs) — a function is read when the PDF is made */
  photos?: { src: string; caption: string }[] | (() => { src: string; caption: string }[]);
};

const COMPANY = "Agrolytix Research";
const LOGO_SRC = "/agrolytix-logo.jpg";
const BANNER_SRC = "/report-banner.jpg";
const NAVY = "#1f2a44";
const TEAL = "#2f6b73";

async function loadImage(src: string): Promise<{ data: string; w: number; h: number; img: HTMLImageElement }> {
  const blob = await (await fetch(src)).blob();
  const data = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Could not load the image"));
    r.readAsDataURL(blob);
  });
  const img = new Image();
  img.src = data;
  await img.decode();
  return { data, w: img.naturalWidth, h: img.naturalHeight, img };
}

/** an image cropped to fill w×h points (like CSS object-fit: cover), as a JPEG data URL */
async function coverCrop(src: string, w: number, h: number): Promise<string> {
  const { img } = await loadImage(src);
  const scale = 3; // points → pixels, sharp enough for print
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const k = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
  const dw = img.naturalWidth * k;
  const dh = img.naturalHeight * k;
  canvas.getContext("2d")!.drawImage(img, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
  return canvas.toDataURL("image/jpeg", 0.88);
}

/**
 * The report's first page: the field-to-mill photo banner, a navy title band with the report name
 * and date, a row of this week's field photographs, the "Inside this report" list, and the brand
 * at the foot. White in both themes.
 */
export async function drawCover(pdf: jsPDF, report: PdfReport) {
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const m = 40; // side margin

  pdf.setFillColor("#ffffff");
  pdf.rect(0, 0, pageW, pageH, "F");

  // photo banner, edge to edge
  let y = 0;
  try {
    const banner = await loadImage(BANNER_SRC);
    const h = (pageW * banner.h) / banner.w;
    pdf.addImage(banner.data, "JPEG", 0, 0, pageW, h);
    y = h;
  } catch {
    y = 40;
  }

  // title band
  const bandH = 118;
  pdf.setFillColor(NAVY);
  pdf.rect(0, y, pageW, bandH, "F");
  pdf.setFillColor(TEAL);
  pdf.rect(0, y, pageW, 4, "F");
  const [big, small] = report.title.includes(":") ? report.title.split(/:\s*/, 2) : [report.title, ""];
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor("#9fb4c9");
  pdf.text("AGROLYTIX RESEARCH  ·  MARKET INTELLIGENCE", m, y + 30, { charSpace: 1.2 });
  pdf.setFontSize(30);
  pdf.setTextColor("#ffffff");
  pdf.text(big, m, y + 66);
  if (small) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(18);
    pdf.setTextColor("#d9e4ee");
    pdf.text(small, m, y + 92);
  }
  // date pill on the right
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  const dateW = pdf.getTextWidth(report.dateLine) + 28;
  pdf.setFillColor(TEAL);
  pdf.roundedRect(pageW - m - dateW, y + 50, dateW, 26, 13, 13, "F");
  pdf.setTextColor("#ffffff");
  pdf.text(report.dateLine, pageW - m - dateW / 2, y + 67, { align: "center" });
  y += bandH + 26;

  const label = (text: string, at: number) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(TEAL);
    pdf.text(text, m, at, { charSpace: 1 });
    pdf.setDrawColor("#d6dde3");
    pdf.setLineWidth(0.6);
    pdf.line(m + pdf.getTextWidth(text) + text.length * 1 + 10, at - 3, pageW - m, at - 3);
  };

  // this week's field photographs
  const photos = (typeof report.photos === "function" ? report.photos() : (report.photos ?? [])).slice(0, 3);
  if (photos.length) {
    label("FROM THE FIELDS", y);
    y += 12;
    const gap = 12;
    const w = (pageW - m * 2 - gap * 2) / 3;
    const h = w * 0.95;
    const crops = await Promise.all(photos.map((p) => coverCrop(p.src, w, h).catch(() => null)));
    crops.forEach((data, i) => {
      const x = m + i * (w + gap);
      if (data) pdf.addImage(data, "JPEG", x, y, w, h);
      else {
        pdf.setFillColor("#eef1f3");
        pdf.rect(x, y, w, h, "F");
      }
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor("#5b6470");
      pdf.text(pdf.splitTextToSize(photos[i].caption, w)[0] ?? "", x, y + h + 12);
    });
    y += h + 36;
  }

  // inside this report — numbered, two columns
  const contents = report.contents ?? [];
  if (contents.length) {
    label("INSIDE THIS REPORT", y);
    y += 22;
    const perCol = Math.ceil(contents.length / 2);
    const colW = (pageW - m * 2) / 2;
    contents.forEach((c, i) => {
      const x = m + (i < perCol ? 0 : colW);
      const ry = y + (i % perCol) * 23;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10.5);
      pdf.setTextColor(TEAL);
      pdf.text(String(i + 1).padStart(2, "0"), x, ry);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor("#1f2933");
      pdf.text(c, x + 24, ry);
    });
  }

  // brand at the foot
  const footY = pageH - 92;
  pdf.setDrawColor(TEAL);
  pdf.setLineWidth(1);
  pdf.line(m, footY, pageW - m, footY);
  try {
    const logo = await loadImage(LOGO_SRC);
    const logoH = 44;
    pdf.addImage(logo.data, "JPEG", m, footY + 14, (logoH * logo.w) / logo.h, logoH);
  } catch {
    // no logo — the company line still names the publisher
  }
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(NAVY);
  pdf.text(COMPANY, pageW - m, footY + 28, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor("#6b7280");
  pdf.text("India Cotton Market Intelligence", pageW - m, footY + 42, { align: "right" });
  pdf.setFontSize(7.5);
  pdf.text("Confidential · prepared for clients of Agrolytix Research", pageW - m, footY + 56, { align: "right" });
  pdf.setFillColor(TEAL);
  pdf.rect(0, pageH - 8, pageW, 8, "F");
}

/**
 * Downloads the current page as a PDF that looks exactly like the screen: the page content
 * is rendered to an image (html2canvas-pro — same layout, theme, colours and charts) and laid
 * out on A4 pages by jsPDF. Page breaks are placed between cards (`.panel`) so no card is cut
 * in half. Controls marked `.print-hide` (buttons, nav) are left out.
 * With `reports`, the button opens a menu of report types, each adding its own cover page.
 */
/** waits for every image in `el` to finish loading (or fail), at most 20 s */
function imagesLoaded(el: HTMLElement) {
  const pending = Array.from(el.querySelectorAll("img")).filter((img) => !img.complete);
  if (!pending.length) return Promise.resolve();
  return Promise.race([
    Promise.all(pending.map((img) => new Promise((r) => { img.addEventListener("load", r, { once: true }); img.addEventListener("error", r, { once: true }); }))),
    new Promise((r) => setTimeout(r, 20000)),
  ]);
}

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
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4", compress: true });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 18;

      // lay the live page out as the PDF shows it (print-hide parts removed, full-width rows), so the
      // page cuts measured here match what's captured
      const root = document.documentElement;
      root.classList.add("pdf-capture", `pdf-${report?.key ?? "page"}`);
      try {
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        await imagesLoaded(target);

        const box = target.getBoundingClientRect();
        const ptPerCss = (pageW - margin * 2) / box.width;
        const sliceH = Math.floor((pageH - margin * 2) / ptPerCss); // CSS px that fit on one page

        // where a page may break: just below each card
        const breaks = Array.from(target.querySelectorAll<HTMLElement>(".panel"))
          .map((el) => Math.round(el.getBoundingClientRect().bottom - box.top + 6))
          .filter((b) => b > 0 && b < box.height)
          .sort((a, b) => a - b);

        let first = true;
        if (report) {
          await drawCover(pdf, report);
          first = false;
        }

        // one capture per PDF page: a long report (field photos and all) in a single canvas would
        // pass the browser's canvas size limit
        let y = 0;
        while (y < box.height - 2) {
          let end = Math.min(y + sliceH, box.height);
          if (end < box.height) {
            // prefer the lowest card edge on this page, as long as it uses at least 40% of it
            const cut = breaks.filter((b) => b > y + sliceH * 0.4 && b <= end).pop();
            if (cut) end = cut;
          }
          const part = await html2canvas(target, {
            scale: 2,
            backgroundColor: bg,
            useCORS: true,
            logging: false,
            windowWidth: document.documentElement.clientWidth,
            y,
            height: Math.ceil(end - y),
            // the PDF button stays laid out (hidden below) so nothing shifts against the cuts measured above
            ignoreElements: (el) => (el.classList?.contains("print-hide") && !el.classList.contains("pdf-keep-live")) ?? false,
            // the cloned page replays CSS animations from their first frame — e.g. the page's
            // fade-in (`animate-rise`, opacity 0 → 1) — which captured the content washed out
            onclone: (doc) => {
              const style = doc.createElement("style");
              style.textContent =
                "*,*::before,*::after{animation:none!important;transition:none!important}.animate-rise{opacity:1!important;transform:none!important}" +
                ".pdf-keep-live{visibility:hidden!important}";
              doc.head.appendChild(style);
            },
          });

          if (!first) pdf.addPage();
          first = false;
          pdf.setFillColor(bg);
          pdf.rect(0, 0, pageW, pageH, "F");
          pdf.addImage(part.toDataURL("image/jpeg", 0.9), "JPEG", margin, margin, pageW - margin * 2, (end - y) * ptPerCss);
          y = end;
        }
      } finally {
        root.classList.remove("pdf-capture", `pdf-${report?.key ?? "page"}`);
      }

      pdf.save(`${report?.fileName ?? fileName}.pdf`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span ref={menuRef} className="print-hide pdf-keep-live relative inline-flex items-center gap-2">
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
