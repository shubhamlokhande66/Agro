"use client";

/** Editors for the simple collection shapes: string lists, number lists, key→value maps. */

import { useEffect, useState } from "react";
import {
  AddButton,
  ColorInput,
  DateInput,
  EmptyRow,
  IconButton,
  NumInput,
  TextInput,
  Toolbar,
  move,
  uniqueKey,
} from "./kit";

/* ------------------------------------------------------------------ */
/*  string[]  — labels, seasons, years, groups …                       */
/* ------------------------------------------------------------------ */

export function StringListEditor({
  value,
  onChange,
  placeholder = "value",
  addLabel = "+ Add",
  itemType = "text",
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  addLabel?: string;
  itemType?: "text" | "date";
}) {
  const list = value ?? [];
  const set = (i: number, v: string) => onChange(list.map((x, j) => (j === i ? v : x)));
  const del = (i: number) => onChange(list.filter((_, j) => j !== i));

  return (
    <div className="space-y-2">
      {list.length === 0 ? <EmptyRow>No entries yet.</EmptyRow> : null}
      <div className="grid gap-1.5 xs:grid-cols-2 lg:grid-cols-3">
        {list.map((v, i) => (
          <div key={i} className="flex items-center gap-1">
            <span className="num w-6 shrink-0 text-right text-[9px] text-ink-faint">{i + 1}</span>
            {itemType === "date" ? (
              <DateInput value={v} onChange={(nv) => set(i, nv)} />
            ) : (
              <TextInput value={v} onChange={(nv) => set(i, nv)} placeholder={placeholder} />
            )}
            <IconButton title="Move up" onClick={() => onChange(move(list, i, i - 1))}>
              ↑
            </IconButton>
            <IconButton title="Move down" onClick={() => onChange(move(list, i, i + 1))}>
              ↓
            </IconButton>
            <IconButton title="Delete" danger onClick={() => del(i)}>
              ✕
            </IconButton>
          </div>
        ))}
      </div>
      <Toolbar>
        <AddButton label={addLabel} subtle onClick={() => onChange([...list, ""])} />
      </Toolbar>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  number[]  — e.g. rainfall jjasIdx                                  */
/* ------------------------------------------------------------------ */

export function NumListEditor({
  value,
  onChange,
}: {
  value: number[];
  onChange: (v: number[]) => void;
}) {
  const list = value ?? [];
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {list.map((v, i) => (
          <div key={i} className="flex w-24 items-center gap-1">
            <NumInput
              value={v}
              onChange={(nv) => onChange(list.map((x, j) => (j === i ? (nv ?? 0) : x)))}
            />
            <IconButton title="Delete" danger onClick={() => onChange(list.filter((_, j) => j !== i))}>
              ✕
            </IconButton>
          </div>
        ))}
      </div>
      <Toolbar>
        <AddButton label="+ Add" subtle onClick={() => onChange([...list, 0])} />
      </Toolbar>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Ordered-rows hook — lets keys be edited without the row jumping.    */
/* ------------------------------------------------------------------ */

/**
 * Mirrors a `Record<string, V>` as an ordered `[key, value][]` list held in
 * local state, so a half-typed or briefly-blank key doesn't make the row
 * vanish or lose focus. Re-syncs only when the record changes from outside.
 */
function useOrderedRows<V>(
  value: Record<string, V>,
  onChange: (v: Record<string, V>) => void,
) {
  const [rows, setRows] = useState<[string, V][]>(() => Object.entries(value ?? {}));

  const toObj = (list: [string, V][]) => {
    const o: Record<string, V> = {};
    for (const [k, v] of list) if (k.trim() !== "") o[k] = v;
    return o;
  };

  const extSig = JSON.stringify(value ?? {});
  const ownSig = JSON.stringify(toObj(rows));
  useEffect(() => {
    if (extSig !== ownSig) setRows(Object.entries(value ?? {}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extSig]);

  const commit = (list: [string, V][]) => {
    setRows(list);
    onChange(toObj(list));
  };

  return { rows, commit };
}

/* ------------------------------------------------------------------ */
/*  Record<string, value>  — statewise totals, colours, labels …       */
/* ------------------------------------------------------------------ */

type KVKind = "number" | "text" | "color" | "date";

export function KeyValueEditor({
  value,
  onChange,
  kind = "number",
  keyLabel = "Key",
  valueLabel = "Value",
  keyPlaceholder = "key",
}: {
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  kind?: KVKind;
  keyLabel?: string;
  valueLabel?: string;
  keyPlaceholder?: string;
}) {
  const { rows, commit } = useOrderedRows<unknown>(value ?? {}, onChange);
  const [newKey, setNewKey] = useState("");

  const setRow = (i: number, k: string, v: unknown) =>
    commit(rows.map((r, j) => (j === i ? [k, v] : r)));
  const del = (i: number) => commit(rows.filter((_, j) => j !== i));
  const add = () => {
    const k = uniqueKey(newKey.trim() || "key", rows.map(([rk]) => rk));
    commit([...rows, [k, kind === "number" ? 0 : ""]]);
    setNewKey("");
  };

  return (
    <div className="space-y-2">
      {rows.length === 0 ? <EmptyRow>No entries yet.</EmptyRow> : null}
      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="bg-surface-2 text-[10px] uppercase tracking-wide text-ink-faint">
                <th className="border-b border-line px-2.5 py-1.5 text-left font-semibold">{keyLabel}</th>
                <th className="border-b border-line px-2.5 py-1.5 text-left font-semibold">{valueLabel}</th>
                <th className="w-8 border-b border-line" />
              </tr>
            </thead>
            <tbody>
              {rows.map(([k, v], i) => (
                <tr key={i} className="hover:bg-surface-2/40">
                  <td className="w-2/5 border-b border-line/60 px-1.5 py-1">
                    <TextInput value={k} onChange={(nk) => setRow(i, nk, v)} mono placeholder={keyPlaceholder} />
                  </td>
                  <td className="border-b border-line/60 px-1.5 py-1">
                    {kind === "number" ? (
                      <NumInput
                        value={typeof v === "number" ? v : null}
                        align="left"
                        onChange={(nv) => setRow(i, k, nv)}
                      />
                    ) : kind === "color" ? (
                      <ColorInput value={String(v ?? "")} onChange={(nv) => setRow(i, k, nv)} />
                    ) : kind === "date" ? (
                      <DateInput value={String(v ?? "")} onChange={(nv) => setRow(i, k, nv)} />
                    ) : (
                      <TextInput value={String(v ?? "")} onChange={(nv) => setRow(i, k, nv)} />
                    )}
                  </td>
                  <td className="border-b border-line/60 px-1 py-1 text-center">
                    <IconButton title="Delete" danger onClick={() => del(i)}>
                      ✕
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <Toolbar>
        <input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={keyPlaceholder}
          className="w-40 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-[12px] outline-none focus:border-accent"
        />
        <AddButton label="+ Add entry" subtle onClick={add} />
      </Toolbar>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Record<string, {…}>  — object-per-key (e.g. calendar phase legend)  */
/* ------------------------------------------------------------------ */

export function MapCards({
  value,
  onChange,
  fields,
  keyLabel = "Key",
  keyPlaceholder = "key",
  itemName = "entry",
  seed,
}: {
  value: Record<string, Record<string, unknown>>;
  onChange: (v: Record<string, Record<string, unknown>>) => void;
  fields: { key: string; label: string; type: "text" | "color" | "number" }[];
  keyLabel?: string;
  keyPlaceholder?: string;
  itemName?: string;
  seed?: () => Record<string, unknown>;
}) {
  const { rows, commit } = useOrderedRows<Record<string, unknown>>(value ?? {}, onChange);

  const setKey = (i: number, k: string) => commit(rows.map((r, j) => (j === i ? [k, r[1]] : r)));
  const setField = (i: number, fk: string, fv: unknown) =>
    commit(rows.map((r, j) => (j === i ? [r[0], { ...r[1], [fk]: fv }] : r)));
  const del = (i: number) => commit(rows.filter((_, j) => j !== i));
  const add = () =>
    commit([
      ...rows,
      [uniqueKey(keyPlaceholder, rows.map(([k]) => k)), seed ? seed() : {}],
    ]);

  return (
    <div className="space-y-2.5">
      {rows.length === 0 ? <EmptyRow>No {itemName}s yet.</EmptyRow> : null}
      {rows.map(([k, obj], i) => (
        <div key={i} className="rounded-xl border border-line bg-surface-2/40 p-3">
          <div className="mb-2 flex items-end gap-2">
            <label className="flex-1">
              <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">
                {keyLabel}
              </span>
              <TextInput value={k} onChange={(nk) => setKey(i, nk)} mono placeholder={keyPlaceholder} />
            </label>
            <IconButton title="Delete" danger onClick={() => del(i)}>
              ✕
            </IconButton>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {fields.map((f) => (
              <label key={f.key} className="block">
                <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">
                  {f.label}
                </span>
                {f.type === "color" ? (
                  <ColorInput
                    value={String(obj[f.key] ?? "")}
                    onChange={(v) => setField(i, f.key, v)}
                  />
                ) : f.type === "number" ? (
                  <NumInput
                    value={typeof obj[f.key] === "number" ? (obj[f.key] as number) : null}
                    align="left"
                    onChange={(v) => setField(i, f.key, v)}
                  />
                ) : (
                  <TextInput
                    value={String(obj[f.key] ?? "")}
                    onChange={(v) => setField(i, f.key, v)}
                  />
                )}
              </label>
            ))}
          </div>
        </div>
      ))}
      <AddButton label={`+ Add ${itemName}`} onClick={add} />
    </div>
  );
}
