"use client";

import clsx from "clsx";
import { useRef, useState } from "react";
import { DateInput, SelectInput, TextArea, TextInput } from "@/components/admin/kit";
import {
  CONDITIONS,
  CROP_STAGES,
  GROUND_STATES,
  RAINFALL,
  imageUrl,
  reportWeek,
  type GroundPhoto,
  type GroundReport,
  type GroundReportBlob,
  type StateReport,
} from "@/data/groundReport";

const MAX_PHOTOS = 3;
const MAX_EDGE = 1600; // px, longest side after resizing

const todayIST = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
const newId = () => Math.random().toString(36).slice(2, 10);
const emptyState = (state: string): StateReport => ({
  state,
  stage: "",
  condition: "",
  rainfall: "",
  commentary: "",
  traderView: "",
  photos: [],
});

/** shrink a photo in the browser (longest side ≤ 1600px, JPEG) so uploads stay small */
async function resizeImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not process the image"))), "image/jpeg", 0.82),
  );
}

async function uploadPhoto(file: File): Promise<string> {
  const body = await resizeImage(file);
  const res = await fetch("/api/ground/images", { method: "POST", headers: { "content-type": "image/jpeg" }, body });
  const out = await res.json().catch(() => ({}));
  if (!res.ok || !out.id) throw new Error(out.error ?? `Upload failed (${res.status})`);
  return out.id as string;
}

const weekText = (date: string) => {
  const w = reportWeek(date);
  const f = (d: string, y = true) =>
    new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(y ? { year: "numeric" } : {}), timeZone: "UTC" });
  return `${f(w.from, false)} – ${f(w.to)}`;
};

/**
 * Admin editor for the weekly Ground Report: pick or start a week's report, then fill each
 * state's stage / condition / rainfall, commentary, trader view and up to three photos.
 * Edits autosave through the dataset editor; photos upload as soon as they're picked.
 */
export function GroundReportEditor({ data, set }: { data: GroundReportBlob; set: (next: GroundReportBlob) => void }) {
  const reports = [...(data?.reports ?? [])].sort((a, b) => b.date.localeCompare(a.date));
  const [selId, setSelId] = useState<string | null>(reports[0]?.id ?? null);
  const [openState, setOpenState] = useState<string | null>(GROUND_STATES[0].code);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const report = reports.find((r) => r.id === selId) ?? null;

  const saveReports = (next: GroundReport[]) => set({ ...data, reports: next });
  const patchReport = (patch: Partial<GroundReport>) =>
    report && saveReports(reports.map((r) => (r.id === report.id ? { ...r, ...patch } : r)));
  const patchState = (code: string, patch: Partial<StateReport>) => {
    if (!report) return;
    const has = report.states.some((s) => s.state === code);
    const states = has
      ? report.states.map((s) => (s.state === code ? { ...s, ...patch } : s))
      : [...report.states, { ...emptyState(code), ...patch }];
    patchReport({ states });
  };

  function newReport() {
    // this week already has a report — open it rather than start a second one
    const thisWeek = reportWeek(todayIST()).from;
    const existing = reports.find((r) => reportWeek(r.date).from === thisWeek);
    if (existing) {
      setSelId(existing.id);
      return;
    }
    // carry last week's stage / condition / rainfall forward; text and photos start fresh
    const last = reports[0];
    const r: GroundReport = {
      id: newId(),
      date: todayIST(),
      title: "",
      summary: "",
      author: last?.author ?? "",
      states: GROUND_STATES.map((s) => {
        const prev = last?.states.find((x) => x.state === s.code);
        return { ...emptyState(s.code), stage: prev?.stage ?? "", condition: prev?.condition ?? "", rainfall: prev?.rainfall ?? "" };
      }),
    };
    saveReports([r, ...reports]);
    setSelId(r.id);
    setOpenState(GROUND_STATES[0].code);
  }

  function deleteReport() {
    if (!report) return;
    for (const s of report.states) for (const p of s.photos) fetch(imageUrl(p.id), { method: "DELETE" }).catch(() => {});
    const rest = reports.filter((r) => r.id !== report.id);
    saveReports(rest);
    setSelId(rest[0]?.id ?? null);
    setConfirmDelete(false);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      {/* report list */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={newReport}
          className="focusable w-full rounded-xl bg-accent px-3 py-2.5 text-[12.5px] font-semibold text-accent-contrast hover:bg-accent-strong"
        >
          + New week&apos;s report
        </button>
        <div className="overflow-hidden rounded-xl border border-line">
          {reports.length === 0 ? (
            <div className="px-3 py-4 text-center text-[11.5px] text-ink-faint">No reports yet</div>
          ) : (
            reports.map((r, i) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setSelId(r.id);
                  setConfirmDelete(false);
                }}
                className={clsx(
                  "focusable block w-full border-b border-line px-3 py-2 text-left last:border-0",
                  r.id === report?.id ? "bg-accent-soft" : "hover:bg-surface-2",
                )}
              >
                <div className="text-[12px] font-semibold text-ink">
                  {weekText(r.date)}
                  {i === 0 ? <span className="ml-1.5 text-[9.5px] font-bold uppercase text-accent">Live</span> : null}
                </div>
                <div className="truncate text-[10.5px] text-ink-faint">{r.title || "Untitled"}</div>
              </button>
            ))
          )}
        </div>
        <p className="text-[10.5px] leading-relaxed text-ink-faint">
          The newest report is what traders see first; older weeks stay available from the week picker.
        </p>
      </div>

      {/* selected report */}
      {report ? (
        <div className="min-w-0 space-y-4">
          <div className="grid gap-3 rounded-xl border border-line p-3.5 sm:grid-cols-[160px_minmax(0,1fr)]">
            <Field label="Report date">
              <DateInput value={report.date} onChange={(date) => patchReport({ date })} />
              <div className="mt-1 text-[10.5px] text-ink-faint">Week of {weekText(report.date)}</div>
            </Field>
            <Field label="Headline">
              <TextInput
                value={report.title}
                onChange={(title) => patchReport({ title })}
                placeholder="e.g. Picking gathers pace in Gujarat; rain damage limited to Vidarbha"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Key takeaways for traders — one per line">
                <TextArea
                  rows={4}
                  value={report.summary}
                  onChange={(summary) => patchReport({ summary })}
                  placeholder={"Arrivals to pick up from next week as picking widens in Saurashtra\nQuality good so far; moisture 8–10% in early lots"}
                />
              </Field>
            </div>
            <Field label="Field team / author">
              <TextInput value={report.author} onChange={(author) => patchReport({ author })} placeholder="Agrolytix field team" />
            </Field>
          </div>

          <div className="space-y-2">
            {GROUND_STATES.map((s) => {
              const st = report.states.find((x) => x.state === s.code) ?? emptyState(s.code);
              const open = openState === s.code;
              const done = !!(st.commentary || st.photos.length);
              return (
                <div key={s.code} className="overflow-hidden rounded-xl border border-line">
                  <button
                    type="button"
                    onClick={() => setOpenState(open ? null : s.code)}
                    className="focusable flex w-full items-center justify-between gap-3 bg-surface-2/50 px-3.5 py-2.5 text-left hover:bg-surface-2"
                  >
                    <span className="text-[13px] font-semibold text-ink">{s.label}</span>
                    <span className="flex items-center gap-2 text-[11px] text-ink-faint">
                      {[st.stage, st.condition, st.rainfall].filter(Boolean).join(" · ")}
                      <span className="num">{st.photos.length}/{MAX_PHOTOS} photos</span>
                      <span className={clsx("h-2 w-2 rounded-full", done ? "bg-pos" : "bg-line")} />
                      <span>{open ? "▴" : "▾"}</span>
                    </span>
                  </button>
                  {open ? (
                    <div className="space-y-3 p-3.5">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Field label="Crop stage">
                          <SelectInput value={st.stage} onChange={(stage) => patchState(s.code, { stage })} options={["", ...CROP_STAGES]} />
                        </Field>
                        <Field label="Crop condition">
                          <SelectInput
                            value={st.condition}
                            onChange={(condition) => patchState(s.code, { condition })}
                            options={["", ...CONDITIONS.map((c) => c.value)]}
                          />
                        </Field>
                        <Field label="Rainfall">
                          <SelectInput
                            value={st.rainfall}
                            onChange={(rainfall) => patchState(s.code, { rainfall })}
                            options={["", ...RAINFALL.map((c) => c.value)]}
                          />
                        </Field>
                      </div>
                      <PhotoSlots photos={st.photos} onChange={(photos) => patchState(s.code, { photos })} />
                      <Field label="Ground commentary — crop stage, crop status, rainfall, pests, picking">
                        <TextArea rows={5} value={st.commentary} onChange={(commentary) => patchState(s.code, { commentary })} />
                      </Field>
                      <Field label="Trader view — what it means for arrivals, quality, yield and prices">
                        <TextArea rows={2} value={st.traderView} onChange={(traderView) => patchState(s.code, { traderView })} />
                      </Field>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            {confirmDelete ? (
              <>
                <span className="text-[12px] text-neg">Delete this week&apos;s report and its photos?</span>
                <button type="button" onClick={deleteReport} className="focusable rounded-lg bg-neg px-3 py-1.5 text-[12px] font-semibold text-white">
                  Delete
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="focusable rounded-lg border border-line px-3 py-1.5 text-[12px]">
                  Cancel
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="focusable rounded-lg px-3 py-1.5 text-[12px] text-neg hover:bg-neg-soft">
                Delete report
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid place-items-center rounded-xl border border-dashed border-line p-10 text-[12.5px] text-ink-faint">
          Start with “+ New week&apos;s report”.
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">{label}</div>
      {children}
    </div>
  );
}

/** up to three photos: upload, caption, location, remove */
function PhotoSlots({ photos, onChange }: { photos: GroundPhoto[]; onChange: (p: GroundPhoto[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // the latest list, so uploads that finish one after another all land
  const latest = useRef(photos);
  latest.current = photos;

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setErr(null);
    setBusy(true);
    try {
      for (const f of Array.from(files).slice(0, MAX_PHOTOS - latest.current.length)) {
        const id = await uploadPhoto(f);
        latest.current = [...latest.current, { id, caption: "", location: "" }];
        onChange(latest.current);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  const patch = (i: number, p: Partial<GroundPhoto>) => onChange(photos.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const remove = (i: number) => {
    fetch(imageUrl(photos[i].id), { method: "DELETE" }).catch(() => {});
    onChange(photos.filter((_, j) => j !== i));
  };
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= photos.length) return;
    const next = [...photos];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">Photographs (up to {MAX_PHOTOS})</div>
      <div className="grid gap-2.5 sm:grid-cols-3">
        {photos.map((p, i) => (
          <div key={p.id} className="space-y-1.5 rounded-xl border border-line p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl(p.id)} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
            <TextInput value={p.caption} onChange={(caption) => patch(i, { caption })} placeholder="Caption, e.g. Boll bursting, first picking due" />
            <TextInput value={p.location} onChange={(location) => patch(i, { location })} placeholder="Location, e.g. Rajkot" />
            <div className="flex justify-between text-[11px]">
              <span className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="focusable rounded px-1.5 hover:bg-surface-2 disabled:opacity-30">
                  ←
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === photos.length - 1} className="focusable rounded px-1.5 hover:bg-surface-2 disabled:opacity-30">
                  →
                </button>
              </span>
              <button type="button" onClick={() => remove(i)} className="focusable rounded px-1.5 text-neg hover:bg-neg-soft">
                Remove
              </button>
            </div>
          </div>
        ))}
        {photos.length < MAX_PHOTOS ? (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="focusable grid min-h-[140px] place-items-center rounded-xl border border-dashed border-line text-[12px] text-ink-faint hover:border-accent hover:text-accent disabled:opacity-50"
          >
            {busy ? "Uploading…" : "+ Add photo"}
          </button>
        ) : null}
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files)} />
      {err ? <div className="mt-1 text-[11px] text-neg">⚠ {err}</div> : null}
    </div>
  );
}
