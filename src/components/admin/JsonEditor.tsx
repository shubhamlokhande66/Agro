"use client";

import { useState } from "react";
import clsx from "clsx";

type Json = any;

const isObj = (v: Json) => v != null && typeof v === "object" && !Array.isArray(v);
const isArr = Array.isArray;
const isColor = (v: unknown) => typeof v === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);

function coerce(raw: string, prev: Json): Json {
  if (typeof prev === "number") {
    if (raw.trim() === "") return null;
    const n = Number(raw);
    return Number.isNaN(n) ? raw : n;
  }
  if (typeof prev === "boolean") return raw === "true";
  if (prev === null) {
    if (raw === "") return null;
    const n = Number(raw);
    return raw === "true" || raw === "false"
      ? raw === "true"
      : !Number.isNaN(n) && raw.trim() !== ""
        ? n
        : raw;
  }
  return raw;
}

/* ------- primitive input ------- */
function Prim({
  value,
  onChange,
}: {
  value: Json;
  onChange: (v: Json) => void;
}) {
  const str = value === null ? "" : String(value);
  return (
    <div className="flex items-center gap-1.5">
      {isColor(value) ? (
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-8 cursor-pointer rounded border border-line bg-transparent p-0.5"
        />
      ) : null}
      <input
        value={str}
        onChange={(e) => onChange(coerce(e.target.value, value))}
        className={clsx(
          "num w-full rounded-lg border border-line bg-surface-2 px-2 py-1 text-[12px] text-ink outline-none focus:border-accent focus:bg-surface",
          typeof value === "number" && "text-right",
        )}
        placeholder={value === null ? "null" : ""}
      />
    </div>
  );
}

/* ------- array of objects → table ------- */
function ObjArray({
  value,
  onChange,
}: {
  value: Json[];
  onChange: (v: Json[]) => void;
}) {
  const cols = Array.from(
    value.reduce<Set<string>>((s, row) => {
      if (isObj(row)) Object.keys(row).forEach((k) => s.add(k));
      return s;
    }, new Set()),
  );
  const template = () =>
    Object.fromEntries(
      cols.map((c) => {
        const sample = value.find((r) => isObj(r) && r[c] != null)?.[c];
        return [c, typeof sample === "number" ? 0 : typeof sample === "boolean" ? false : ""];
      }),
    );

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c} className="border-b border-line bg-surface-2 px-2 py-1.5 text-left font-semibold text-ink-faint">
                {c}
              </th>
            ))}
            <th className="border-b border-line bg-surface-2 px-2 py-1.5 w-8" />
          </tr>
        </thead>
        <tbody>
          {value.map((row, i) => (
            <tr key={i} className="hover:bg-surface-2/50">
              {cols.map((c) => (
                <td key={c} className="border-b border-line/70 px-1.5 py-1">
                  <Prim
                    value={isObj(row) ? row[c] ?? null : null}
                    onChange={(v) => {
                      const next = value.slice();
                      next[i] = { ...(isObj(row) ? row : {}), [c]: v };
                      onChange(next);
                    }}
                  />
                </td>
              ))}
              <td className="border-b border-line/70 px-1 py-1 text-center">
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, j) => j !== i))}
                  className="rounded px-1.5 text-ink-faint hover:text-neg"
                  title="Delete row"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-line bg-surface-2/40 p-1.5">
        <button
          type="button"
          onClick={() => onChange([...value, template()])}
          className="rounded-lg bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-contrast hover:bg-accent-strong"
        >
          + Add row
        </button>
      </div>
    </div>
  );
}

/* ------- array of primitives ------- */
function PrimArray({
  value,
  onChange,
}: {
  value: Json[];
  onChange: (v: Json[]) => void;
}) {
  return (
    <div className="rounded-xl border border-line p-2">
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
        {value.map((v, i) => (
          <div key={i} className="flex items-center gap-1">
            <span className="num w-6 shrink-0 text-right text-[9px] text-ink-faint">{i}</span>
            <Prim value={v} onChange={(nv) => onChange(value.map((x, j) => (j === i ? nv : x)))} />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="shrink-0 text-[10px] text-ink-faint hover:text-neg"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...value, typeof value[0] === "number" ? 0 : ""])}
        className="mt-2 rounded-lg bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-ink-soft hover:bg-surface-3"
      >
        + Add item
      </button>
    </div>
  );
}

/* ------- recursive node ------- */
function Node({
  label,
  value,
  onChange,
  onRemove,
  depth,
}: {
  label: string;
  value: Json;
  onChange: (v: Json) => void;
  onRemove?: () => void;
  depth: number;
}) {
  const [open, setOpen] = useState(depth < 1);

  if (isArr(value)) {
    const objArr = value.length > 0 && value.every((x) => isObj(x));
    return (
      <div className="py-1">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-ink"
        >
          <span className="text-ink-faint">{open ? "▾" : "▸"}</span>
          {label}
          <span className="num text-[10px] font-normal text-ink-faint">[{value.length}]</span>
        </button>
        {open ? (
          <div className="mt-1.5 pl-3">
            {objArr ? (
              <ObjArray value={value} onChange={onChange} />
            ) : (
              <PrimArray value={value} onChange={onChange} />
            )}
          </div>
        ) : null}
      </div>
    );
  }

  if (isObj(value)) {
    const keys = Object.keys(value);
    return (
      <div className="py-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-ink"
          >
            <span className="text-ink-faint">{open ? "▾" : "▸"}</span>
            {label}
            <span className="num text-[10px] font-normal text-ink-faint">{`{${keys.length}}`}</span>
          </button>
          {onRemove ? (
            <button type="button" onClick={onRemove} className="text-[10px] text-ink-faint hover:text-neg">
              remove
            </button>
          ) : null}
        </div>
        {open ? (
          <div className={clsx("mt-1 space-y-0.5 border-l border-line pl-3", depth > 3 && "pl-2")}>
            {keys.map((k) => (
              <Node
                key={k}
                label={k}
                depth={depth + 1}
                value={value[k]}
                onChange={(v) => onChange({ ...value, [k]: v })}
                onRemove={() => {
                  const next = { ...value };
                  delete next[k];
                  onChange(next);
                }}
              />
            ))}
            <AddKey
              onAdd={(k, v) => {
                if (!k || k in value) return;
                onChange({ ...value, [k]: v });
              }}
            />
          </div>
        ) : null}
      </div>
    );
  }

  // primitive
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="w-40 shrink-0 truncate text-[12px] text-ink-soft" title={label}>
        {label}
      </span>
      <div className="flex-1">
        <Prim value={value} onChange={onChange} />
      </div>
      {onRemove ? (
        <button type="button" onClick={onRemove} className="text-[10px] text-ink-faint hover:text-neg">
          ✕
        </button>
      ) : null}
    </div>
  );
}

function AddKey({ onAdd }: { onAdd: (k: string, v: Json) => void }) {
  const [k, setK] = useState("");
  const [kind, setKind] = useState<"number" | "text" | "object" | "array">("number");
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      <input
        value={k}
        onChange={(e) => setK(e.target.value)}
        placeholder="new key"
        className="w-32 rounded-lg border border-line bg-surface-2 px-2 py-1 text-[11px] outline-none focus:border-accent"
      />
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value as any)}
        className="rounded-lg border border-line bg-surface-2 px-1.5 py-1 text-[11px]"
      >
        <option value="number">number</option>
        <option value="text">text</option>
        <option value="object">object</option>
        <option value="array">array</option>
      </select>
      <button
        type="button"
        onClick={() => {
          onAdd(k.trim(), kind === "number" ? 0 : kind === "text" ? "" : kind === "array" ? [] : {});
          setK("");
        }}
        className="rounded-lg bg-surface-2 px-2 py-1 text-[11px] font-semibold text-ink-soft hover:bg-surface-3"
      >
        + Add key
      </button>
    </div>
  );
}

export function JsonEditor({
  value,
  onChange,
}: {
  value: Json;
  onChange: (v: Json) => void;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      {isObj(value) || isArr(value) ? (
        <Node label="root" value={value} onChange={onChange} depth={0} />
      ) : (
        <Prim value={value} onChange={onChange} />
      )}
    </div>
  );
}
