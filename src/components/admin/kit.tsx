"use client";

/**
 * Shared building blocks for the schema-driven dataset editors.
 * Every dashboard dataset is edited through these — no raw JSON required.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */

export function SectionCard({
  title,
  hint,
  right,
  children,
}: {
  title: string;
  hint?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="panel p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold tracking-tight text-ink">{title}</h3>
          {hint ? <p className="mt-0.5 text-[11px] leading-relaxed text-ink-faint">{hint}</p> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 flex flex-wrap items-center gap-2">{children}</div>;
}

export function AddButton({
  label,
  onClick,
  subtle,
}: {
  label: string;
  onClick: () => void;
  subtle?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "rounded-lg px-3 py-1.5 text-[11.5px] font-semibold transition-colors",
        subtle
          ? "bg-surface-2 text-ink-soft hover:bg-surface-3"
          : "bg-accent text-accent-contrast hover:bg-accent-strong",
      )}
    >
      {label}
    </button>
  );
}

export function IconButton({
  title,
  onClick,
  children,
  danger,
  disabled,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "grid h-6 w-6 shrink-0 place-items-center rounded-md text-[11px] text-ink-faint transition-colors disabled:opacity-30",
        danger ? "hover:bg-neg-soft hover:text-neg" : "hover:bg-surface-2 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Field inputs                                                       */
/* ------------------------------------------------------------------ */

const inputCls =
  "w-full rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-[12.5px] text-ink outline-none transition-colors placeholder:text-ink-faint/60 focus:border-accent focus:bg-surface focus:ring-2 focus:ring-[var(--ring)]";

export function TextInput({
  value,
  onChange,
  placeholder,
  mono,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <input
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={clsx(inputCls, mono && "num")}
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value ?? ""}
      placeholder={placeholder}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      className={clsx(inputCls, "resize-y leading-relaxed")}
    />
  );
}

/** Numeric input that round-trips `null` for an empty box. */
export function NumInput({
  value,
  onChange,
  placeholder = "—",
  align = "right",
}: {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  placeholder?: string;
  align?: "left" | "right";
}) {
  const [text, setText] = useState<string | null>(null);
  const shown = text ?? (value == null || Number.isNaN(value) ? "" : String(value));
  return (
    <input
      value={shown}
      inputMode="decimal"
      placeholder={placeholder}
      onFocus={() => setText(shown)}
      onBlur={() => setText(null)}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        if (raw.trim() === "") return onChange(null);
        const n = Number(raw);
        if (!Number.isNaN(n)) onChange(n);
      }}
      className={clsx(inputCls, "num", align === "right" && "text-right")}
    />
  );
}

export function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly (string | { value: string; label: string })[];
}) {
  const norm = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className={clsx(inputCls, "cursor-pointer")}
    >
      {norm.every((o) => o.value !== value) ? <option value={value}>{value || "—"}</option> : null}
      {norm.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Native date input — gives every browser's built-in calendar picker. */
export function DateInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="date"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className={clsx(inputCls, "num")}
    />
  );
}

export function ColorInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const valid = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value ?? "");
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="color"
        value={valid ? value : "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-9 shrink-0 cursor-pointer rounded-md border border-line bg-transparent p-0.5"
      />
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#16a34a"
        className={clsx(inputCls, "num")}
      />
    </div>
  );
}

export function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </span>
      {children}
    </label>
  );
}

/** A vertical stack of labelled number boxes — e.g. one row per year. No grid,
 *  no shared column headers to cross-reference: every field just has its own label. */
export function NumberFieldStack({
  labels,
  value,
  onChange,
  columns = 2,
}: {
  labels: string[];
  value: (number | null | undefined)[];
  onChange: (v: (number | null)[]) => void;
  columns?: 1 | 2 | 3;
}) {
  const cols = columns === 1 ? "" : columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  return (
    <div className={clsx("grid gap-2.5", cols)}>
      {labels.map((l, i) => (
        <Labeled key={i} label={l}>
          <NumInput
            value={value[i] ?? null}
            align="left"
            onChange={(v) => {
              const next = value.slice();
              next[i] = v;
              onChange(next as (number | null)[]);
            }}
          />
        </Labeled>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal — click-to-add / click-to-edit forms                         */
/* ------------------------------------------------------------------ */

export function Modal({
  title,
  onClose,
  onSubmit,
  submitLabel = "Save",
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/40 p-4 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.();
        }}
        className={clsx(
          "my-8 w-full rounded-2xl border border-line bg-surface p-5 shadow-pop animate-rise",
          wide ? "max-w-2xl" : "max-w-lg",
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-lg text-ink-faint hover:bg-surface-2 hover:text-ink"
          >
            ✕
          </button>
        </div>

        {children}

        <div className="mt-5 flex justify-end gap-2 border-t border-line pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-surface-2 px-4 py-2 text-[12.5px] font-semibold text-ink-soft hover:bg-surface-3"
          >
            Cancel
          </button>
          {onSubmit ? (
            <button
              type="submit"
              className="rounded-xl bg-accent px-4 py-2 text-[12.5px] font-semibold text-accent-contrast hover:bg-accent-strong"
            >
              {submitLabel}
            </button>
          ) : null}
        </div>
      </form>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/*  Empty-state                                                        */
/* ------------------------------------------------------------------ */

export function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-[11.5px] text-ink-faint">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

export const move = <T,>(arr: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= arr.length) return arr;
  const next = arr.slice();
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
};

export const uniqueKey = (base: string, taken: Iterable<string>): string => {
  const set = new Set(taken);
  if (!set.has(base)) return base;
  let i = 2;
  while (set.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
};
