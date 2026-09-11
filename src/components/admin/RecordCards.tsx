"use client";

/** Compact always-editable table for short nested record lists (e.g. a crop's phase timeline). */

import { AddButton, EmptyRow, IconButton, move } from "./kit";
import { FieldControl, blankFromFields, type FieldSpec } from "./fields";

export type { FieldSpec, FieldType } from "./fields";

export function RecordTable<T extends Record<string, any>>({
  value,
  onChange,
  fields,
  itemName = "row",
  makeItem,
}: {
  value: T[];
  onChange: (v: T[]) => void;
  fields: FieldSpec[];
  itemName?: string;
  makeItem?: () => T;
}) {
  const list = value ?? [];
  const patchAt = (i: number, p: Partial<T>) =>
    onChange(list.map((it, j) => (j === i ? { ...it, ...p } : it)));

  return (
    <div className="space-y-2.5">
      {list.length === 0 ? <EmptyRow>No {itemName}s yet.</EmptyRow> : null}
      <div className="overflow-auto rounded-xl border border-line" style={{ maxHeight: "62vh" }}>
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-surface-2 text-[10px] uppercase tracking-wide text-ink-faint">
              <th className="sticky left-0 top-0 z-20 border-b border-r border-line bg-surface-2 px-1.5 py-2" />
              {fields.map((f) => (
                <th
                  key={f.key}
                  className="sticky top-0 z-10 border-b border-line bg-surface-2 px-2 py-2 text-left font-semibold"
                >
                  {f.label}
                </th>
              ))}
              <th className="sticky top-0 z-10 w-8 border-b border-line bg-surface-2" />
            </tr>
          </thead>
          <tbody>
            {list.map((item, i) => (
              <tr key={i} className="hover:bg-surface-2/40">
                <td className="sticky left-0 z-10 border-b border-r border-line bg-surface px-1.5 py-1 text-center">
                  <span className="num text-[9px] text-ink-faint">{i + 1}</span>
                </td>
                {fields.map((f) => (
                  <td key={f.key} className="border-b border-line/60 px-1 py-1">
                    <FieldControl
                      field={f}
                      value={item[f.key]}
                      onChange={(v) => patchAt(i, { [f.key]: v } as Partial<T>)}
                    />
                  </td>
                ))}
                <td className="border-b border-line/60 px-0.5 py-1">
                  <div className="flex">
                    <IconButton title="Move up" onClick={() => onChange(move(list, i, i - 1))}>
                      ↑
                    </IconButton>
                    <IconButton title="Delete" danger onClick={() => onChange(list.filter((_, j) => j !== i))}>
                      ✕
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddButton
        label={`+ Add ${itemName}`}
        onClick={() => onChange([...list, makeItem ? makeItem() : blankFromFields<T>(fields)])}
      />
    </div>
  );
}
