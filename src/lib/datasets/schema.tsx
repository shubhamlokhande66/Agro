"use client";

/**
 * Per-dataset editor layouts — the "Products admin" pattern, applied
 * everywhere: a table of entries, an "+ Add" button that opens a plain
 * label + box form in a popup, Save reflects straight into the table.
 *
 * Every dataset is broken into named sections. A section's `render(data, set)`
 * receives the whole dataset blob and a setter that replaces it; the nested
 * shape Mongo actually stores is converted to/from flat rows by the helpers
 * in `./rows` so the person filling the form never has to think about it.
 */

import { DateInput, Labeled, NumInput, NumberFieldStack, SelectInput, TextArea, TextInput } from "@/components/admin/kit";
import { KeyValueEditor, NumListEditor, StringListEditor } from "@/components/admin/collections";
import { RecordManager, type RecordManagerHandle } from "@/components/admin/RecordManager";
import { RecordTable } from "@/components/admin/RecordCards";
import { WD_CATEGORIES } from "@/data/wasde";
import {
  flattenCategoryYear,
  flattenMulti,
  flattenNested,
  flattenObjMap,
  flattenSeries,
  isNum,
  rowsToZip,
  unflattenCategoryYear,
  unflattenMulti,
  unflattenNested,
  unflattenObjMap,
  unflattenSeries,
  zipToRows,
} from "@/lib/datasets/rows";

export type EditorSection = {
  id: string;
  title: string;
  hint?: string;
  /** if set, the page shows a "+ Add …" button in its own top-right header that opens this section's add form */
  primaryAdd?: { label: string };
  render: (
    data: any,
    set: (next: any) => void,
    /** attach to this section's RecordManager so the page header's "+ Add" button can open it */
    adderRef?: React.RefObject<RecordManagerHandle>,
  ) => React.ReactNode;
};

/* helpers ---------------------------------------------------------- */

const num = (v: unknown): number | null => (isNum(v) ? v : null);

const prettyLabel = (key: string): string =>
  key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const numberFields = (keys: string[]) => keys.map((k) => ({ key: k, label: prettyLabel(k), type: "number" as const }));

const MONTHS_CAL = ["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];

/* ================================================================== */
/*  Markets                                                            */
/* ================================================================== */

const pricesSchema: EditorSection[] = [
  {
    id: "varieties",
    title: "Varieties",
    hint: "Click a variety to edit its price history — grouped together below by variety group.",
    primaryAdd: { label: "Add Price" },
    render: (d, set, adderRef) => {
      const groupOrder: string[] =
        d.groups?.length ? d.groups : Array.from(new Set((d.varieties ?? []).map((v: any) => v.group)));

      const sorted = [...(d.varieties ?? [])].sort((a: any, b: any) => {
        const ga = groupOrder.indexOf(a.group);
        const gb = groupOrder.indexOf(b.group);
        if (ga !== gb) return (ga === -1 ? 999 : ga) - (gb === -1 ? 999 : gb);
        return String(a.title ?? "").localeCompare(String(b.title ?? ""));
      });
      const rows = sorted.map((v: any) => {
        const annual = (v.annual ?? []).slice().sort((a: any, b: any) => String(a.year).localeCompare(String(b.year)));
        const daily = (v.daily ?? []).slice().sort((a: any, b: any) => String(a.date).localeCompare(String(b.date)));
        return {
          ...v,
          annual,
          daily,
          latest: annual.at(-1)?.value ?? null,
          points: daily.length,
        };
      });

      const save = (next: any[]) => {
        const varieties = next.map(({ latest, points, ...rest }: any) => rest);
        const groups = groupOrder.slice();
        for (const v of varieties) if (v.group && !groups.includes(v.group)) groups.push(v.group);
        set({ ...d, varieties, groups });
      };

      return (
        <RecordManager<any>
          ref={adderRef}
          hideAddButton
          groupBy="group"
          value={rows}
          onChange={save}
          itemName="variety"
          columns={[
            { key: "title", label: "Variety", type: "text" },
            { key: "latest", label: "Latest annual (₹)", type: "number" },
            { key: "points", label: "Daily quotes", type: "number" },
          ]}
          makeItem={() => ({ key: "", title: "", sub: "", group: groupOrder[0] ?? "", annual: [], daily: [] })}
          fields={[
            { key: "key", label: "Key (id)", type: "text", placeholder: "guj29" },
            { key: "group", label: "Group", type: "text", placeholder: "Gujarat Varieties" },
            { key: "title", label: "Title", type: "text", full: true },
            { key: "sub", label: "Subtitle", type: "text", full: true },
          ]}
          renderExtra={(v, patch) => (
            <div className="space-y-4">
              <Labeled label="Annual values — pick the year, enter the price">
                <RecordTable<any>
                  value={v.annual ?? []}
                  onChange={(annual) => patch({ annual } as any)}
                  itemName="year"
                  makeItem={() => ({ year: "", value: null })}
                  fields={[
                    { key: "year", label: "Year", type: "text", placeholder: "2026" },
                    { key: "value", label: "Price (₹/Candy)", type: "number" },
                  ]}
                />
              </Labeled>
              <Labeled label="Daily price history — pick the date, enter the price">
                <RecordTable<any>
                  value={v.daily ?? []}
                  onChange={(daily) => patch({ daily } as any)}
                  itemName="quote"
                  makeItem={() => ({ date: new Date().toISOString().slice(0, 10), price: null })}
                  fields={[
                    { key: "date", label: "Date", type: "date" },
                    { key: "price", label: "Price (₹/Candy)", type: "number" },
                  ]}
                />
              </Labeled>
            </div>
          )}
        />
      );
    },
  },
];

function alignedSeriesSection(
  id: string,
  title: string,
  labelsKey: string,
  labelField: string,
  cols: { key: string; arrKey: string; label: string }[],
  primaryAddLabel?: string,
): EditorSection {
  return {
    id,
    title,
    primaryAdd: primaryAddLabel ? { label: primaryAddLabel } : undefined,
    render: (d, set, adderRef) => {
      const rows = zipToRows(
        d[labelsKey] ?? [],
        cols.map((c) => ({ key: c.key, arr: d[c.arrKey] })),
      );
      return (
        <RecordManager<any>
          ref={adderRef}
          hideAddButton={!!primaryAddLabel}
          value={rows}
          onChange={(next) => {
            const { labels, arrays } = rowsToZip(next, cols.map((c) => c.key));
            const patch: Record<string, unknown> = { [labelsKey]: labels };
            for (const c of cols) patch[c.arrKey] = arrays[c.key];
            set({ ...d, ...patch });
          }}
          itemName="entry"
          makeItem={() => ({ label: "", ...Object.fromEntries(cols.map((c) => [c.key, null])) })}
          fields={[
            { key: "label", label: labelField, type: "text" },
            ...cols.map((c) => ({ key: c.key, label: c.label, type: "number" as const })),
          ]}
        />
      );
    },
  };
}

const internationalSchema: EditorSection[] = [
  alignedSeriesSection("ice-annual", "ICE Cotton #2 — Annual", "iceAnnL", "Year", [
    { key: "value", arrKey: "iceAnnV", label: "ICE ¢/lb" },
  ]),
  alignedSeriesSection("ice-monthly", "ICE Cotton #2 & Brent — Monthly", "iceML", "Month", [
    { key: "ice", arrKey: "iceMV", label: "ICE ¢/lb" },
    { key: "brent", arrKey: "brMV", label: "Brent $/bbl" },
  ]),
  alignedSeriesSection("ice-daily", "ICE Cotton #2 — Daily", "iceDL", "Date", [
    { key: "value", arrKey: "iceDV", label: "ICE ¢/lb" },
  ], "Add ICE Quote"),
  alignedSeriesSection("brent-annual", "Brent crude — Annual", "brAnnL", "Year", [
    { key: "value", arrKey: "brAnnV", label: "Brent $/bbl" },
  ]),
];

const currencySchema: EditorSection[] = [
  alignedSeriesSection("monthly", "Monthly — USD/INR & USD/CNY", "monthsL", "Month", [
    { key: "inr", arrKey: "usdinrM", label: "USD/INR" },
    { key: "cny", arrKey: "usdcnyM", label: "USD/CNY" },
  ], "Add Month"),
  alignedSeriesSection("y1", "1-Year daily series", "usdinr1yL", "Date", [
    { key: "inr", arrKey: "usdinr1yV", label: "USD/INR" },
    { key: "cny", arrKey: "usdcny1yV", label: "USD/CNY" },
  ]),
  alignedSeriesSection("y5", "5-Year monthly series", "usdinr5yL", "Month", [
    { key: "inr", arrKey: "usdinr5yV", label: "USD/INR" },
    { key: "cny", arrKey: "usdcny5yV", label: "USD/CNY" },
  ]),
];

const cciSchema: EditorSection[] = [
  {
    id: "datewise",
    title: "Daily OMSS quotes",
    hint: "Click a day to edit it, or add a new one. p = price (₹/candy), v = volume (lakh bales).",
    primaryAdd: { label: "Add Day" },
    render: (d, set, adderRef) => (
      <RecordManager<any>
        ref={adderRef}
        hideAddButton
        value={d.datewise ?? []}
        onChange={(datewise) => set({ ...d, datewise })}
        itemName="day"
        makeItem={() => ({ d: new Date().toISOString().slice(0, 10), p: null, v: null, seas: "" })}
        fields={[
          { key: "d", label: "Date", type: "date" },
          { key: "p", label: "Price", type: "number" },
          { key: "v", label: "Volume", type: "number" },
          { key: "seas", label: "Season", type: "text", placeholder: "2025-26" },
        ]}
      />
    ),
  },
  {
    id: "monthly_sell",
    title: "Monthly OMSS sales",
    hint: "One entry per season + month.",
    render: (d, set) => {
      const cols = ["vol", "avgp", "maxp", "minp"];
      const rows = flattenNested(d.monthly_sell, "season", "month", cols);
      return (
        <RecordManager<any>
          value={rows}
          onChange={(next) => set({ ...d, monthly_sell: unflattenNested(next, "season", "month", cols) })}
          itemName="entry"
          makeItem={() => ({ season: "", month: "", vol: null, avgp: null, maxp: null, minp: null })}
          fields={[
            { key: "season", label: "Season", type: "text", placeholder: "2024-25" },
            { key: "month", label: "Month", type: "text", placeholder: "Mar-2025" },
            { key: "vol", label: "Volume", type: "number" },
            { key: "avgp", label: "Avg price", type: "number" },
            { key: "maxp", label: "Max price", type: "number" },
            { key: "minp", label: "Min price", type: "number" },
          ]}
        />
      );
    },
  },
  {
    id: "proc_monthly",
    title: "Monthly procurement",
    hint: "One entry per season + month.",
    render: (d, set) => {
      const rows = flattenMulti({ value: d.proc_monthly }, "season", "month");
      return (
        <RecordManager<any>
          value={rows}
          onChange={(next) => set({ ...d, proc_monthly: unflattenMulti(next, "season", "month", ["value"]).value })}
          itemName="entry"
          makeItem={() => ({ season: "", month: "", value: null })}
          fields={[
            { key: "season", label: "Season", type: "text", placeholder: "2024-25" },
            { key: "month", label: "Month", type: "text", placeholder: "Nov" },
            { key: "value", label: "Lakh bales", type: "number" },
          ]}
        />
      );
    },
  },
  {
    id: "statewise",
    title: "Statewise procurement",
    render: (d, set) => (
      <KeyValueEditor
        value={d.statewise ?? {}}
        kind="number"
        keyLabel="State"
        valueLabel="Lakh bales"
        onChange={(statewise) => set({ ...d, statewise })}
      />
    ),
  },
  {
    id: "annual",
    title: "Annual totals — procurement / sales / stock",
    render: (d, set) => (
      <div className="space-y-4">
        {(["proc_annual", "sell_annual", "stock_annual"] as const).map((k) => (
          <Labeled key={k} label={prettyLabel(k)}>
            <KeyValueEditor
              value={d[k] ?? {}}
              kind="number"
              keyLabel="Season"
              valueLabel="Lakh bales"
              keyPlaceholder="2024/25"
              onChange={(v) => set({ ...d, [k]: v })}
            />
          </Labeled>
        ))}
      </div>
    ),
  },
  {
    id: "misc",
    title: "Season cut-off & headline totals",
    render: (d, set) => (
      <div className="space-y-4">
        <Labeled label="Season cut-off dates">
          <KeyValueEditor
            value={d.season_cutoff ?? {}}
            kind="date"
            keyLabel="Key"
            valueLabel="Date"
            onChange={(season_cutoff) => set({ ...d, season_cutoff })}
          />
        </Labeled>
        <Labeled label="Totals">
          <KeyValueEditor
            value={d.totals ?? {}}
            kind="number"
            onChange={(totals) => set({ ...d, totals })}
          />
        </Labeled>
      </div>
    ),
  },
];

const newsSchema: EditorSection[] = [
  {
    id: "items",
    title: "Headlines",
    hint: "Click a headline to edit it, or add a new one. Tone controls the colour of the tag pill.",
    primaryAdd: { label: "Add Headline" },
    render: (d, set, adderRef) => (
      <RecordManager<any>
        ref={adderRef}
        hideAddButton
        value={d.items ?? []}
        onChange={(items) => set({ ...d, items })}
        itemName="headline"
        makeItem={() => ({ tag: "NOTE", tone: "info", text: "", meta: "" })}
        columns={[
          { key: "tag", label: "Tag", type: "text" },
          { key: "text", label: "Headline", type: "text" },
          { key: "meta", label: "Meta", type: "text" },
        ]}
        fields={[
          { key: "tag", label: "Tag", type: "text", placeholder: "INDIA" },
          {
            key: "tone",
            label: "Tone",
            type: "select",
            options: ["accent", "info", "warn", "violet", "neg"],
          },
          { key: "text", label: "Headline text", type: "textarea", full: true },
          { key: "meta", label: "Meta (source · date)", type: "text", placeholder: "Mar 2026 · CAI" },
        ]}
      />
    ),
  },
];

/* ================================================================== */
/*  Fundamentals                                                       */
/* ================================================================== */

const arrivalsSchema: EditorSection[] = [
  {
    id: "axes",
    title: "Weeks & seasons",
    hint: "Add the labels here first, then record the numbers below.",
    render: (d, set) => (
      <div className="space-y-4">
        <Labeled label="Weeks">
          <StringListEditor value={d.weeks ?? []} onChange={(weeks) => set({ ...d, weeks })} placeholder="Feb-IV" />
        </Labeled>
        <Labeled label="Seasons">
          <StringListEditor
            value={d.seasons?.length ? d.seasons : Object.keys(d.values ?? {})}
            onChange={(seasons) => set({ ...d, seasons })}
            placeholder="25-26"
          />
        </Labeled>
      </div>
    ),
  },
  {
    id: "data",
    title: "Arrivals (lakh bales)",
    hint: "Click an entry to edit it, or add a new one.",
    primaryAdd: { label: "Add Entry" },
    render: (d, set, adderRef) => {
      const rows = flattenSeries(d.values, d.weeks ?? []).map((r) => ({ week: r.label, season: r.series, value: r.value }));
      return (
        <RecordManager<any>
          ref={adderRef}
          hideAddButton
          value={rows}
          onChange={(next) => {
            const converted = next.map((r: any) => ({ label: r.week, series: r.season, value: r.value }));
            const { labels, series } = unflattenSeries(converted, d.weeks ?? []);
            set({ ...d, weeks: labels, seasons: Object.keys(series), values: series });
          }}
          itemName="entry"
          makeItem={() => ({ week: (d.weeks ?? [])[0] ?? "", season: (d.seasons ?? [])[0] ?? "", value: null })}
          fields={[
            { key: "week", label: "Week", type: "select", options: d.weeks ?? [] },
            { key: "season", label: "Season", type: "select", options: d.seasons ?? [] },
            { key: "value", label: "Value", type: "number" },
          ]}
        />
      );
    },
  },
];

const sowingSchema: EditorSection[] = [
  {
    id: "axes",
    title: "Weeks",
    render: (d, set) => (
      <StringListEditor value={d.weeks ?? []} onChange={(weeks) => set({ ...d, weeks })} placeholder="Jul-II" />
    ),
  },
  {
    id: "data",
    title: "Sowing progress (lakh ha)",
    hint: "Click an entry to edit it, or add a new one. Use 'Normal' as the series for the long-period average.",
    primaryAdd: { label: "Add Entry" },
    render: (d, set, adderRef) => {
      const seriesRecord: Record<string, number[]> = Object.fromEntries(
        (d.series ?? []).map((s: any) => [s.label, s.data]),
      );
      const rows = flattenSeries(seriesRecord, d.weeks ?? []).map((r) => ({
        week: r.label,
        year: r.series,
        value: r.value,
      }));
      return (
        <RecordManager<any>
          ref={adderRef}
          hideAddButton
          value={rows}
          onChange={(next) => {
            const converted = next.map((r: any) => ({ label: r.week, series: r.year, value: r.value }));
            const { labels, series } = unflattenSeries(converted, d.weeks ?? []);
            set({
              ...d,
              weeks: labels,
              series: Object.entries(series).map(([label, data]) => ({ label, data })),
            });
          }}
          itemName="entry"
          makeItem={() => ({ week: (d.weeks ?? [])[0] ?? "", year: "", value: null })}
          fields={[
            { key: "week", label: "Week", type: "select", options: d.weeks ?? [] },
            { key: "year", label: "Series (year / Normal)", type: "text" },
            { key: "value", label: "Value", type: "number" },
          ]}
        />
      );
    },
  },
];

const productionSchema: EditorSection[] = [
  {
    id: "axes",
    title: "Seasons & states",
    render: (d, set) => (
      <div className="space-y-4">
        <Labeled label="Seasons">
          <StringListEditor value={d.seasons ?? []} onChange={(seasons) => set({ ...d, seasons })} placeholder="2024/25" />
        </Labeled>
        <Labeled label="State keys">
          <StringListEditor value={d.states ?? []} onChange={(states) => set({ ...d, states })} placeholder="GUJARAT" />
        </Labeled>
        <Labeled label="State display names">
          <KeyValueEditor
            value={d.stateLabels ?? {}}
            kind="text"
            keyLabel="Key"
            valueLabel="Label"
            onChange={(stateLabels) => set({ ...d, stateLabels })}
          />
        </Labeled>
      </div>
    ),
  },
  {
    id: "data",
    title: "Area / Yield / Production",
    hint: "Click an entry to edit it, or add a new one.",
    primaryAdd: { label: "Add Entry" },
    render: (d, set, adderRef) => {
      const rows = flattenMulti({ area: d.area, yield: d.yield, prod: d.prod }, "season", "state");
      return (
        <RecordManager<any>
          ref={adderRef}
          hideAddButton
          value={rows}
          onChange={(next) => set({ ...d, ...unflattenMulti(next, "season", "state", ["area", "yield", "prod"]) })}
          itemName="entry"
          makeItem={() => ({ season: (d.seasons ?? [])[0] ?? "", state: (d.states ?? [])[0] ?? "", area: null, yield: null, prod: null })}
          columns={[
            { key: "season", label: "Season", type: "text" },
            { key: "state", label: "State", type: "text" },
            { key: "area", label: "Area", type: "number" },
            { key: "yield", label: "Yield", type: "number" },
            { key: "prod", label: "Production", type: "number" },
          ]}
          fields={[
            { key: "season", label: "Season", type: "select", options: d.seasons ?? [] },
            {
              key: "state",
              label: "State",
              type: "select",
              options: (d.states ?? []).map((s: string) => ({ value: s, label: d.stateLabels?.[s] ?? s })),
            },
            { key: "area", label: "Area (000 ha)", type: "number" },
            { key: "yield", label: "Yield (kg/ha)", type: "number" },
            { key: "prod", label: "Production (lakh bales)", type: "number" },
          ]}
        />
      );
    },
  },
];

const balanceSheetSchema: EditorSection[] = [
  {
    id: "axes",
    title: "Seasons & month order",
    render: (d, set) => (
      <div className="space-y-4">
        <Labeled label="Monthly seasons">
          <StringListEditor value={d.seasons ?? []} onChange={(seasons) => set({ ...d, seasons })} placeholder="2024/25" />
        </Labeled>
        <Labeled label="Month order">
          <StringListEditor
            value={d.months_order ?? []}
            onChange={(months_order) => set({ ...d, months_order })}
            placeholder="Oct"
          />
        </Labeled>
        <Labeled label="Annual seasons">
          <StringListEditor
            value={d.annual_seasons ?? []}
            onChange={(annual_seasons) => set({ ...d, annual_seasons })}
          />
        </Labeled>
      </div>
    ),
  },
  {
    id: "annual",
    title: "Annual supply & demand",
    hint: "Click an entry to edit it, or add a new one.",
    render: (d, set) => {
      const cols = [
        "opening_stocks", "crop_size", "farmer_selling", "imports", "total_supply",
        "msp_procurement", "msp_auctions", "stocks_govt", "domestic_cons", "exports",
        "total_demand", "closing_stocks", "sur_free_mkt", "total_sur",
      ];
      const rows = flattenObjMap(d.annual, "season", cols);
      return (
        <RecordManager<any>
          value={rows}
          onChange={(next) => set({ ...d, annual: unflattenObjMap(next, "season", cols) })}
          itemName="season entry"
          makeItem={() => ({ season: "", ...Object.fromEntries(cols.map((c) => [c, null])) })}
          columns={[
            { key: "season", label: "Season", type: "text" },
            { key: "crop_size", label: "Crop size", type: "number" },
            { key: "total_demand", label: "Total demand", type: "number" },
            { key: "closing_stocks", label: "Closing stocks", type: "number" },
          ]}
          fields={[{ key: "season", label: "Season", type: "select", options: d.annual_seasons ?? [] }, ...numberFields(cols)]}
        />
      );
    },
  },
  {
    id: "monthly",
    title: "Monthly balance",
    hint: "Click an entry to edit it, or add a new one.",
    primaryAdd: { label: "Add Entry" },
    render: (d, set, adderRef) => {
      const cols = [
        "opening", "crop", "farmer_sell", "cci_proc", "cci_sell", "stock_cci",
        "imports", "dom_cons", "nonmill_cons", "total_cons", "exports", "closing",
      ];
      const rows = flattenNested(d.monthly, "season", "month", cols);
      return (
        <RecordManager<any>
          ref={adderRef}
          hideAddButton
          value={rows}
          onChange={(next) => set({ ...d, monthly: unflattenNested(next, "season", "month", cols) })}
          itemName="entry"
          makeItem={() => ({
            season: (d.seasons ?? [])[0] ?? "",
            month: (d.months_order ?? [])[0] ?? "",
            ...Object.fromEntries(cols.map((c) => [c, null])),
          })}
          columns={[
            { key: "season", label: "Season", type: "text" },
            { key: "month", label: "Month", type: "text" },
            { key: "closing", label: "Closing", type: "number" },
          ]}
          fields={[
            { key: "season", label: "Season", type: "select", options: d.seasons ?? [] },
            { key: "month", label: "Month", type: "select", options: d.months_order ?? [] },
            ...numberFields(cols),
          ]}
        />
      );
    },
  },
];

const tradeSchema: EditorSection[] = [
  {
    id: "axes",
    title: "Seasons & months",
    render: (d, set) => (
      <div className="space-y-4">
        <Labeled label="Seasons">
          <StringListEditor value={d.seasons ?? []} onChange={(seasons) => set({ ...d, seasons })} placeholder="2025-26" />
        </Labeled>
        <Labeled label="Months">
          <StringListEditor value={d.months ?? []} onChange={(months) => set({ ...d, months })} placeholder="Oct" />
        </Labeled>
      </div>
    ),
  },
  {
    id: "data",
    title: "Import & Export (lakh bales)",
    hint: "Click an entry to edit it, or add a new one.",
    primaryAdd: { label: "Add Entry" },
    render: (d, set, adderRef) => {
      const rows = flattenMulti({ import: d.import, export: d.export }, "season", "month");
      return (
        <RecordManager<any>
          ref={adderRef}
          hideAddButton
          value={rows}
          onChange={(next) => set({ ...d, ...unflattenMulti(next, "season", "month", ["import", "export"]) })}
          itemName="entry"
          makeItem={() => ({ season: (d.seasons ?? [])[0] ?? "", month: (d.months ?? [])[0] ?? "", import: null, export: null })}
          fields={[
            { key: "season", label: "Season", type: "select", options: d.seasons ?? [] },
            { key: "month", label: "Month", type: "select", options: d.months ?? [] },
            { key: "import", label: "Import", type: "number" },
            { key: "export", label: "Export", type: "number" },
          ]}
        />
      );
    },
  },
  {
    id: "totals",
    title: "Season totals",
    render: (d, set) => (
      <div className="space-y-4">
        <Labeled label="Import totals">
          <KeyValueEditor
            value={d.import_totals ?? {}}
            kind="number"
            keyLabel="Season"
            valueLabel="Lakh bales"
            onChange={(import_totals) => set({ ...d, import_totals })}
          />
        </Labeled>
        <Labeled label="Export totals">
          <KeyValueEditor
            value={d.export_totals ?? {}}
            kind="number"
            keyLabel="Season"
            valueLabel="Lakh bales"
            onChange={(export_totals) => set({ ...d, export_totals })}
          />
        </Labeled>
      </div>
    ),
  },
  {
    id: "settings",
    title: "Settings",
    render: (d, set) => (
      <div className="grid gap-3 sm:grid-cols-3">
        <Labeled label="Actual data cut-off — season">
          <SelectInput
            value={d.actual_cutoff?.season ?? ""}
            options={d.seasons ?? []}
            onChange={(v) => set({ ...d, actual_cutoff: { ...(d.actual_cutoff ?? {}), season: v } })}
          />
        </Labeled>
        <Labeled label="Actual data cut-off — month">
          <SelectInput
            value={d.actual_cutoff?.month ?? ""}
            options={d.months ?? []}
            onChange={(v) => set({ ...d, actual_cutoff: { ...(d.actual_cutoff ?? {}), month: v } })}
          />
        </Labeled>
        <Labeled label="Lakh bales → KMT factor">
          <NumInput value={num(d.lb_to_kmt)} align="left" onChange={(v) => set({ ...d, lb_to_kmt: v ?? 17 })} />
        </Labeled>
      </div>
    ),
  },
];

const copSchema: EditorSection[] = [
  {
    id: "emoji",
    title: "Crop icons",
    render: (d, set) => (
      <KeyValueEditor
        value={d.emoji ?? {}}
        kind="text"
        keyLabel="Crop"
        valueLabel="Emoji"
        onChange={(emoji) => set({ ...d, emoji })}
      />
    ),
  },
  {
    id: "data",
    title: "Cost of production & returns",
    hint: "Click an entry to edit it, or add a new one. Cost components for that year are edited inside.",
    primaryAdd: { label: "Add Entry" },
    render: (d, set, adderRef) => {
      const data: Record<string, any> = d.data ?? {};
      const totalKeys = ["total_cost", "yield", "price", "gross_return", "net_return", "roi"];
      const rows: any[] = [];
      for (const [crop, block] of Object.entries(data)) {
        const years: string[] = (block as any).years ?? [];
        years.forEach((year, yi) => {
          const row: any = { crop, year };
          for (const k of totalKeys) {
            const v = (block as any).totals?.[k]?.[yi];
            row[k] = isNum(v) ? v : null;
          }
          rows.push(row);
        });
      }

      const save = (next: any[]) => {
        const nextData: Record<string, any> = {};
        const byCrop = new Map<string, any[]>();
        for (const r of next) {
          if (!r.crop) continue;
          if (!byCrop.has(r.crop)) byCrop.set(r.crop, []);
          byCrop.get(r.crop)!.push(r);
        }
        for (const [crop, crows] of byCrop) {
          const prevBlock = data[crop] ?? { years: [], cost_components: {}, totals: {} };
          const years = crows.map((r) => r.year);
          const totals: Record<string, number[]> = {};
          for (const k of totalKeys) totals[k] = crows.map((r) => (isNum(r[k]) ? r[k] : NaN));

          const cost_components: Record<string, number[]> = {};
          for (const [name, arr] of Object.entries(prevBlock.cost_components ?? {})) {
            cost_components[name] = years.map((y: string) => {
              const oldIdx = (prevBlock.years ?? []).indexOf(y);
              const v = oldIdx >= 0 ? (arr as number[])[oldIdx] : undefined;
              return isNum(v) ? v : NaN;
            });
          }
          for (const r of crows) {
            if (!r.__components) continue;
            for (const [name, v] of Object.entries(r.__components as Record<string, number | null>)) {
              if (!cost_components[name]) cost_components[name] = years.map(() => NaN);
              const yi = years.indexOf(r.year);
              cost_components[name][yi] = isNum(v) ? v : NaN;
            }
          }
          nextData[crop] = { years, cost_components, totals };
        }
        set({ ...d, data: nextData });
      };

      return (
        <RecordManager<any>
          ref={adderRef}
          hideAddButton
          value={rows}
          onChange={save}
          itemName="entry"
          makeItem={() => ({
            crop: Object.keys(data)[0] ?? "",
            year: "",
            total_cost: null, yield: null, price: null, gross_return: null, net_return: null, roi: null,
          })}
          columns={[
            { key: "crop", label: "Crop", type: "text" },
            { key: "year", label: "Year", type: "text" },
            { key: "total_cost", label: "Total cost", type: "number" },
            { key: "net_return", label: "Net return", type: "number" },
            { key: "roi", label: "ROI %", type: "number" },
          ]}
          fields={[
            { key: "crop", label: "Crop", type: "text" },
            { key: "year", label: "Year", type: "text", placeholder: "2025-26" },
            ...numberFields(["total_cost", "yield", "price", "gross_return", "net_return", "roi"]),
          ]}
          renderExtra={(row, patch) => {
            const block = data[row.crop];
            const yi = block ? (block.years ?? []).indexOf(row.year) : -1;
            const current: Record<string, number | null> =
              row.__components ??
              Object.fromEntries(
                Object.entries(block?.cost_components ?? {}).map(([name, arr]: [string, any]) => [
                  name,
                  yi >= 0 && isNum(arr?.[yi]) ? arr[yi] : null,
                ]),
              );
            return (
              <Labeled label="Cost components (₹/acre)">
                <KeyValueEditor
                  value={current}
                  kind="number"
                  keyLabel="Component"
                  valueLabel="Value"
                  onChange={(next) => patch({ __components: next } as any)}
                />
              </Labeled>
            );
          }}
        />
      );
    },
  },
];

const calendarSchema: EditorSection[] = [
  {
    id: "months",
    title: "Month axis",
    render: (d, set) => (
      <StringListEditor
        value={d.months ?? MONTHS_CAL}
        onChange={(months) => set({ ...d, months })}
        placeholder="May"
      />
    ),
  },
  {
    id: "phaseMeta",
    title: "Phase legend",
    hint: "Click a phase to edit it, or add a new one. Phase keys are referenced by the state timelines below.",
    render: (d, set) => {
      const meta: Record<string, { label: string; color: string }> = d.phaseMeta ?? {};
      const rows = Object.entries(meta).map(([key, v]) => ({ key, label: v.label, color: v.color }));
      return (
        <RecordManager<any>
          value={rows}
          onChange={(next) => {
            const out: Record<string, { label: string; color: string }> = {};
            for (const r of next) if (r.key) out[r.key] = { label: r.label, color: r.color };
            set({ ...d, phaseMeta: out });
          }}
          itemName="phase"
          makeItem={() => ({ key: "", label: "", color: "#16a34a" })}
          fields={[
            { key: "key", label: "Key", type: "text", placeholder: "sow" },
            { key: "label", label: "Label", type: "text" },
            { key: "color", label: "Colour", type: "color" },
          ]}
        />
      );
    },
  },
  {
    id: "states",
    title: "State timelines",
    hint: "Click a state to edit it, or add a new one. Phase start/end are month positions (0 = first month, fractions allowed).",
    primaryAdd: { label: "Add State" },
    render: (d, set, adderRef) => {
      const phaseKeys = Object.keys(d.phaseMeta ?? {});
      return (
        <RecordManager<any>
          ref={adderRef}
          hideAddButton
          value={d.states ?? []}
          onChange={(states) => set({ ...d, states })}
          itemName="state"
          columns={[
            { key: "flag", label: "", type: "text" },
            { key: "name", label: "Name", type: "text" },
            { key: "season", label: "Season", type: "text" },
            { key: "variety", label: "Variety", type: "text" },
          ]}
          makeItem={() => ({
            name: "", flag: "🌿", color: "#0369a1", area: "", variety: "",
            season: "", sowPeak: "", harvPeak: "", notes: "", phases: [],
          })}
          fields={[
            { key: "name", label: "Name", type: "text" },
            { key: "flag", label: "Flag / emoji", type: "text" },
            { key: "color", label: "Colour", type: "color" },
            { key: "area", label: "Area", type: "text", placeholder: "~28 Lakh Ha" },
            { key: "variety", label: "Variety", type: "text" },
            { key: "season", label: "Season", type: "text", placeholder: "May–Feb" },
            { key: "sowPeak", label: "Sowing peak", type: "text" },
            { key: "harvPeak", label: "Harvest peak", type: "text" },
            { key: "notes", label: "Notes", type: "textarea" },
          ]}
          renderExtra={(s, patch) => (
            <Labeled label="Phases">
              <RecordTable<any>
                value={s.phases ?? []}
                onChange={(phases) => patch({ phases })}
                itemName="phase"
                makeItem={() => ({ key: phaseKeys[0] ?? "", start: 0, end: 1 })}
                fields={[
                  { key: "key", label: "Phase", type: "select", options: phaseKeys },
                  { key: "start", label: "Start", type: "number" },
                  { key: "end", label: "End", type: "number" },
                ]}
              />
            </Labeled>
          )}
        />
      );
    },
  },
];

/* ================================================================== */
/*  Global                                                             */
/* ================================================================== */

const rainfallSchema: EditorSection[] = [
  {
    id: "axes",
    title: "Axes & weights",
    render: (d, set) => (
      <div className="space-y-4">
        <Labeled label="Months (8: May–Dec)">
          <StringListEditor value={d.months ?? []} onChange={(months) => set({ ...d, months })} />
        </Labeled>
        <Labeled label="All years">
          <StringListEditor value={d.allYears ?? []} onChange={(allYears) => set({ ...d, allYears })} placeholder="2025" />
        </Labeled>
        <Labeled label="JJAS month indices">
          <NumListEditor value={d.jjasIdx ?? [1, 2, 3, 4]} onChange={(jjasIdx) => set({ ...d, jjasIdx })} />
        </Labeled>
        <Labeled label="State weights (%)">
          <KeyValueEditor value={d.weights ?? {}} kind="number" keyLabel="State" valueLabel="Weight" onChange={(weights) => set({ ...d, weights })} />
        </Labeled>
      </div>
    ),
  },
  {
    id: "colors",
    title: "Colours & IMD labels",
    render: (d, set) => (
      <div className="space-y-4">
        <Labeled label="Year palette">
          <KeyValueEditor value={d.yearPalette ?? {}} kind="color" keyLabel="Year" valueLabel="Colour" onChange={(yearPalette) => set({ ...d, yearPalette })} />
        </Labeled>
        <Labeled label="State colours">
          <KeyValueEditor value={d.stateColors ?? {}} kind="color" keyLabel="State" valueLabel="Colour" onChange={(stateColors) => set({ ...d, stateColors })} />
        </Labeled>
        <Labeled label="IMD subdivision labels">
          <KeyValueEditor value={d.stateImd ?? {}} kind="text" keyLabel="State" valueLabel="IMD label" onChange={(stateImd) => set({ ...d, stateImd })} />
        </Labeled>
      </div>
    ),
  },
  {
    id: "composite",
    title: "Composite belt rainfall (mm)",
    hint: "Click an entry to edit it, or add a new one — one per series ('normal' or a year), with a value for each month.",
    render: (d, set) => {
      const months = d.months ?? [];
      const rows = Object.entries(d.composite ?? {}).map(([series, values]) => ({ series, values }));
      return (
        <RecordManager<any>
          value={rows}
          onChange={(next) => {
            const composite: Record<string, number[]> = {};
            for (const r of next) if (r.series) composite[r.series] = months.map((_: string, i: number) => (isNum(r.values?.[i]) ? r.values[i] : NaN));
            set({ ...d, composite });
          }}
          itemName="series"
          makeItem={() => ({ series: "", values: months.map(() => null) })}
          columns={[{ key: "series", label: "Series", type: "text" }]}
          fields={[{ key: "series", label: "Series (normal / y2025 …)", type: "text" }]}
          renderExtra={(row, patch) => (
            <Labeled label="Monthly rainfall (mm)">
              <NumberFieldStack labels={months} value={row.values ?? []} onChange={(values) => patch({ values } as any)} />
            </Labeled>
          )}
        />
      );
    },
  },
  {
    id: "rfh",
    title: "Subdivision rainfall",
    hint: "Click an entry to edit it, or add a new one — one per state + subdivision + series, with a value for each month.",
    primaryAdd: { label: "Add Entry" },
    render: (d, set, adderRef) => {
      const months = d.months ?? [];
      const rfh: Record<string, Record<string, any>> = d.rfh ?? {};
      const rows: any[] = [];
      for (const [state, subs] of Object.entries(rfh)) {
        for (const [subKey, sub] of Object.entries(subs ?? {})) {
          const seriesKeys = Object.keys(sub ?? {}).filter((k) => k !== "label");
          for (const s of seriesKeys) {
            rows.push({
              state, subdivision: subKey, subLabel: (sub as any).label ?? subKey, series: s,
              values: (sub as any)[s] ?? months.map(() => null),
            });
          }
        }
      }
      const save = (next: any[]) => {
        const out: Record<string, Record<string, any>> = {};
        for (const r of next) {
          if (!r.state || !r.subdivision || !r.series) continue;
          if (!out[r.state]) out[r.state] = {};
          if (!out[r.state][r.subdivision]) out[r.state][r.subdivision] = { label: r.subLabel || r.subdivision };
          out[r.state][r.subdivision].label = r.subLabel || out[r.state][r.subdivision].label || r.subdivision;
          out[r.state][r.subdivision][r.series] = months.map((_: string, i: number) => (isNum(r.values?.[i]) ? r.values[i] : NaN));
        }
        set({ ...d, rfh: out });
      };
      return (
        <RecordManager<any>
          ref={adderRef}
          hideAddButton
          value={rows}
          onChange={save}
          itemName="entry"
          makeItem={() => ({ state: "", subdivision: "", subLabel: "", series: "normal", values: months.map(() => null) })}
          columns={[
            { key: "state", label: "State", type: "text" },
            { key: "subdivision", label: "Subdivision", type: "text" },
            { key: "series", label: "Series", type: "text" },
          ]}
          fields={[
            { key: "state", label: "State", type: "text" },
            { key: "subdivision", label: "Subdivision key", type: "text", placeholder: "_state" },
            { key: "subLabel", label: "Subdivision display label", type: "text" },
            { key: "series", label: "Series (normal / y2025 …)", type: "text" },
          ]}
          renderExtra={(row, patch) => (
            <Labeled label="Monthly rainfall (mm)">
              <NumberFieldStack labels={months} value={row.values ?? []} onChange={(values) => patch({ values } as any)} />
            </Labeled>
          )}
        />
      );
    },
  },
];

const wasdeSchema: EditorSection[] = [
  {
    id: "meta",
    title: "Report metadata",
    render: (d, set) => {
      const meta: Record<string, any> = d.meta ?? {};
      const KNOWN = ["latest_report", "latest_date", "next_report", "release_dates_2026", "unit", "marketing_year", "note"];
      const extra: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(meta)) if (!KNOWN.includes(k) && !Array.isArray(v)) extra[k] = v;
      const setMeta = (patch: Record<string, unknown>) => set({ ...d, meta: { ...meta, ...patch } });
      return (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Labeled label="Latest report">
              <TextInput value={meta.latest_report ?? ""} onChange={(v) => setMeta({ latest_report: v })} placeholder="January 2026" />
            </Labeled>
            <Labeled label="Latest report date">
              <DateInput value={meta.latest_date ?? ""} onChange={(v) => setMeta({ latest_date: v })} />
            </Labeled>
            <Labeled label="Next report date">
              <DateInput value={meta.next_report ?? ""} onChange={(v) => setMeta({ next_report: v })} />
            </Labeled>
            <Labeled label="Unit">
              <TextInput value={meta.unit ?? ""} onChange={(v) => setMeta({ unit: v })} placeholder="1000 MT (KMT)" />
            </Labeled>
            <Labeled label="Marketing year">
              <TextInput value={meta.marketing_year ?? ""} onChange={(v) => setMeta({ marketing_year: v })} placeholder="August-July" />
            </Labeled>
          </div>
          <Labeled label="Note">
            <TextArea value={meta.note ?? ""} onChange={(v) => setMeta({ note: v })} />
          </Labeled>
          <Labeled label="2026 release dates">
            <StringListEditor
              value={meta.release_dates_2026 ?? []}
              itemType="date"
              onChange={(release_dates_2026) => setMeta({ release_dates_2026 })}
            />
          </Labeled>
          {Object.keys(extra).length ? (
            <Labeled label="Other fields">
              <KeyValueEditor value={extra} kind="text" onChange={(next) => setMeta(next)} />
            </Labeled>
          ) : null}
        </div>
      );
    },
  },
  {
    id: "years",
    title: "Report columns (years)",
    render: (d, set) => (
      <StringListEditor value={d.years ?? []} onChange={(years) => set({ ...d, years })} placeholder="2025/26 Jan" />
    ),
  },
  {
    id: "data",
    title: "World cotton balance (1000 MT)",
    hint: "Click an entry to edit it, or add a new one.",
    primaryAdd: { label: "Add Entry" },
    render: (d, set, adderRef) => {
      const catKeys = WD_CATEGORIES.map((c) => c.key);
      const cats: Record<string, any> = {};
      for (const c of catKeys) cats[c] = d[c];
      const rows = flattenCategoryYear(cats, d.years ?? []);
      return (
        <RecordManager<any>
          ref={adderRef}
          hideAddButton
          value={rows}
          onChange={(next) => {
            const { years, cats: nextCats } = unflattenCategoryYear(next, catKeys, d.years ?? []);
            set({ ...d, years, ...nextCats });
          }}
          itemName="entry"
          makeItem={() =>
            Object.fromEntries([
              ["country", ""],
              ["year", (d.years ?? [])[0] ?? ""],
              ...catKeys.map((k) => [k, null]),
            ])
          }
          columns={[
            { key: "country", label: "Country", type: "text" },
            { key: "year", label: "Year", type: "text" },
            ...WD_CATEGORIES.map((c) => ({ key: c.key, label: c.label, type: "number" as const })),
          ]}
          fields={[
            { key: "country", label: "Country", type: "text", placeholder: "Brazil" },
            { key: "year", label: "Year", type: "select", options: d.years ?? [] },
            ...WD_CATEGORIES.map((c) => ({ key: c.key, label: c.label, type: "number" as const })),
          ]}
        />
      );
    },
  },
];

/* ================================================================== */

export const SCHEMAS: Record<string, EditorSection[]> = {
  prices: pricesSchema,
  international: internationalSchema,
  currency: currencySchema,
  cci: cciSchema,
  news: newsSchema,
  arrivals: arrivalsSchema,
  sowing: sowingSchema,
  production: productionSchema,
  balanceSheet: balanceSheetSchema,
  trade: tradeSchema,
  cop: copSchema,
  calendar: calendarSchema,
  rainfall: rainfallSchema,
  wasde: wasdeSchema,
};
