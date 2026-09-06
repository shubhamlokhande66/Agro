"use client";

import { useState } from "react";

export type Grid = {
  rows: string[];
  cols: string[];
  /** cells[rowIndex][colIndex] */
  cells: (number | null)[][];
};

/** Convert arrivals blob → grid and back */
export const arrivalsAdapter = {
  toGrid(b: any): Grid {
    const cols: string[] = b.seasons ?? Object.keys(b.values ?? {});
    return {
      rows: b.weeks ?? [],
      cols,
      cells: (b.weeks ?? []).map((_: string, r: number) =>
        cols.map((c: string) => {
          const v = b.values?.[c]?.[r];
          return typeof v === "number" && !Number.isNaN(v) ? v : null;
        }),
      ),
    };
  },
  fromGrid(g: Grid, prev: any) {
    const values: Record<string, number[]> = {};
    g.cols.forEach((c, ci) => {
      values[c] = g.rows.map((_, ri) => g.cells[ri]?.[ci] ?? NaN);
    });
    return { ...prev, weeks: g.rows, seasons: g.cols, values };
  },
};

/** Convert sowing blob → grid and back */
export const sowingAdapter = {
  toGrid(b: any): Grid {
    const cols: string[] = (b.series ?? []).map((s: any) => s.label);
    return {
      rows: b.weeks ?? [],
      cols,
      cells: (b.weeks ?? []).map((_: string, r: number) =>
        (b.series ?? []).map((s: any) => {
          const v = s.data?.[r];
          return typeof v === "number" && !Number.isNaN(v) ? v : null;
        }),
      ),
    };
  },
  fromGrid(g: Grid, prev: any) {
    const series = g.cols.map((label, ci) => ({
      label,
      data: g.rows.map((_, ri) => g.cells[ri]?.[ci] ?? NaN),
    }));
    return { ...prev, weeks: g.rows, series };
  },
};

export function GridEditor({
  grid,
  onChange,
}: {
  grid: Grid;
  onChange: (g: Grid) => void;
}) {
  const [newRow, setNewRow] = useState("");
  const [newCol, setNewCol] = useState("");

  const setCell = (r: number, c: number, v: string) => {
    const num = v.trim() === "" ? null : Number(v);
    const cells = grid.cells.map((row) => row.slice());
    cells[r][c] = Number.isNaN(num as number) ? null : (num as number | null);
    onChange({ ...grid, cells });
  };
  const renameRow = (r: number, v: string) =>
    onChange({ ...grid, rows: grid.rows.map((x, i) => (i === r ? v : x)) });
  const renameCol = (c: number, v: string) =>
    onChange({ ...grid, cols: grid.cols.map((x, i) => (i === c ? v : x)) });
  const delRow = (r: number) =>
    onChange({
      ...grid,
      rows: grid.rows.filter((_, i) => i !== r),
      cells: grid.cells.filter((_, i) => i !== r),
    });
  const delCol = (c: number) =>
    onChange({
      ...grid,
      cols: grid.cols.filter((_, i) => i !== c),
      cells: grid.cells.map((row) => row.filter((_, i) => i !== c)),
    });
  const addRow = () => {
    if (!newRow.trim()) return;
    onChange({
      ...grid,
      rows: [...grid.rows, newRow.trim()],
      cells: [...grid.cells, grid.cols.map(() => null)],
    });
    setNewRow("");
  };
  const addCol = () => {
    if (!newCol.trim()) return;
    onChange({
      ...grid,
      cols: [...grid.cols, newCol.trim()],
      cells: grid.cells.map((row) => [...row, null]),
    });
    setNewCol("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <input
            value={newRow}
            onChange={(e) => setNewRow(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addRow()}
            placeholder="new week / row label"
            className="w-48 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-[12px] outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={addRow}
            className="rounded-lg bg-accent px-3 py-1.5 text-[11.5px] font-semibold text-accent-contrast hover:bg-accent-strong"
          >
            + Add row
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            value={newCol}
            onChange={(e) => setNewCol(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCol()}
            placeholder="new season / series"
            className="w-44 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-[12px] outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={addCol}
            className="rounded-lg bg-surface-2 px-3 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:bg-surface-3"
          >
            + Add column
          </button>
        </div>
      </div>

      <div className="overflow-auto rounded-xl border border-line" style={{ maxHeight: "62vh" }}>
        <table className="border-collapse text-[12px]">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-20 border-b border-r border-line bg-surface-2 px-2 py-1.5 text-left">
                Week
              </th>
              {grid.cols.map((c, ci) => (
                <th key={ci} className="sticky top-0 z-10 border-b border-line bg-surface-2 px-1.5 py-1">
                  <div className="flex items-center gap-1">
                    <input
                      value={c}
                      onChange={(e) => renameCol(ci, e.target.value)}
                      className="w-24 rounded border border-line bg-surface px-1 py-0.5 text-[11px] font-semibold outline-none focus:border-accent"
                    />
                    <button
                      type="button"
                      onClick={() => delCol(ci)}
                      className="text-[10px] text-ink-faint hover:text-neg"
                      title="Delete column"
                    >
                      ✕
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.rows.map((r, ri) => (
              <tr key={ri} className="hover:bg-surface-2/40">
                <th className="sticky left-0 z-10 border-b border-r border-line bg-surface px-1.5 py-1 text-left font-normal">
                  <div className="flex items-center gap-1">
                    <input
                      value={r}
                      onChange={(e) => renameRow(ri, e.target.value)}
                      className="w-28 rounded border border-line bg-surface-2 px-1 py-0.5 text-[11px] outline-none focus:border-accent"
                    />
                    <button
                      type="button"
                      onClick={() => delRow(ri)}
                      className="text-[10px] text-ink-faint hover:text-neg"
                      title="Delete row"
                    >
                      ✕
                    </button>
                  </div>
                </th>
                {grid.cols.map((_, ci) => (
                  <td key={ci} className="border-b border-line/60 px-0.5 py-0.5">
                    <input
                      value={grid.cells[ri]?.[ci] ?? ""}
                      onChange={(e) => setCell(ri, ci, e.target.value)}
                      inputMode="decimal"
                      className="num w-20 rounded border border-transparent bg-transparent px-1 py-1 text-right text-[12px] outline-none hover:border-line focus:border-accent focus:bg-surface"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
