"use client";

/**
 * Admin-panel-style record list: a read-only table of existing entries, an
 * "+ Add" button that opens a form in a modal, and a row-level Edit/Delete.
 * Filling the modal and clicking Save reflects the change straight into the
 * table — nothing is ever left half-edited inline.
 */

import { useState } from "react";
import { AddButton, EmptyRow, IconButton, Labeled, Modal } from "./kit";
import { FieldControl, blankFromFields, fieldPreview, type FieldSpec } from "./fields";

export function RecordManager<T extends Record<string, any>>({
  value,
  onChange,
  fields,
  columns,
  itemName = "item",
  makeItem,
  renderExtra,
}: {
  value: T[];
  onChange: (v: T[]) => void;
  fields: FieldSpec[];
  /** which fields become table columns (defaults to every non-textarea field) */
  columns?: FieldSpec[];
  itemName?: string;
  makeItem?: () => T;
  /** extra form content rendered inside the modal, below the standard fields */
  renderExtra?: (draft: T, patch: (p: Partial<T>) => void) => React.ReactNode;
}) {
  const list = value ?? [];
  const cols = columns ?? fields.filter((f) => f.type !== "textarea");
  const [modal, setModal] = useState<{ index: number | null; draft: T } | null>(null);

  const openAdd = () => setModal({ index: null, draft: makeItem ? makeItem() : blankFromFields<T>(fields) });
  const openEdit = (i: number) => setModal({ index: i, draft: structuredClone(list[i]) });
  const close = () => setModal(null);
  const patch = (p: Partial<T>) => setModal((m) => (m ? { ...m, draft: { ...m.draft, ...p } } : m));
  const save = () => {
    if (!modal) return;
    if (modal.index == null) onChange([...list, modal.draft]);
    else onChange(list.map((it, j) => (j === modal.index ? modal.draft : it)));
    setModal(null);
  };
  const del = (i: number) => {
    if (window.confirm(`Delete this ${itemName}?`)) onChange(list.filter((_, j) => j !== i));
  };

  return (
    <div className="space-y-3">
      {list.length === 0 ? (
        <EmptyRow>No {itemName}s yet — add one below.</EmptyRow>
      ) : (
        <div className="overflow-auto rounded-xl border border-line" style={{ maxHeight: "60vh" }}>
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="bg-surface-2 text-[10px] uppercase tracking-wide text-ink-faint">
                {cols.map((f) => (
                  <th
                    key={f.key}
                    className="sticky top-0 z-10 border-b border-line bg-surface-2 px-2.5 py-2 text-left font-semibold"
                  >
                    {f.label}
                  </th>
                ))}
                <th className="sticky top-0 z-10 w-16 border-b border-line bg-surface-2" />
              </tr>
            </thead>
            <tbody>
              {list.map((item, i) => (
                <tr
                  key={i}
                  className="cursor-pointer hover:bg-surface-2/50"
                  onClick={() => openEdit(i)}
                >
                  {cols.map((f) => (
                    <td key={f.key} className="border-b border-line/60 px-2.5 py-2 text-ink">
                      {f.type === "color" ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-line"
                            style={{ background: item[f.key] }}
                          />
                          <span className="num text-[11px] text-ink-faint">{item[f.key]}</span>
                        </span>
                      ) : (
                        fieldPreview(f, item[f.key])
                      )}
                    </td>
                  ))}
                  <td className="border-b border-line/60 px-1.5 py-1 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end">
                      <IconButton title={`Edit ${itemName}`} onClick={() => openEdit(i)}>
                        ✎
                      </IconButton>
                      <IconButton title={`Delete ${itemName}`} danger onClick={() => del(i)}>
                        ✕
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddButton label={`+ Add ${itemName}`} onClick={openAdd} />

      {modal ? (
        <Modal
          title={modal.index == null ? `Add ${itemName}` : `Edit ${itemName}`}
          onClose={close}
          onSubmit={save}
          submitLabel={modal.index == null ? "Add" : "Save"}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key} className={f.full || f.type === "textarea" ? "sm:col-span-2" : ""}>
                <Labeled label={f.label}>
                  <FieldControl
                    field={f}
                    value={modal.draft[f.key]}
                    onChange={(v) => patch({ [f.key]: v } as Partial<T>)}
                  />
                </Labeled>
              </div>
            ))}
          </div>
          {renderExtra ? (
            <div className="mt-3 border-t border-line pt-3">{renderExtra(modal.draft, patch)}</div>
          ) : null}
        </Modal>
      ) : null}
    </div>
  );
}
