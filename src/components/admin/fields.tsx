"use client";

/** Shared field spec + renderer used by RecordManager and RecordTable. */

import { ColorInput, DateInput, NumInput, SelectInput, TextArea, TextInput } from "./kit";

export type FieldType = "text" | "textarea" | "number" | "select" | "color" | "date";

export type FieldSpec = {
  key: string;
  label: string;
  type: FieldType;
  options?: readonly (string | { value: string; label: string })[];
  placeholder?: string;
  /** span the full row/card width */
  full?: boolean;
};

export function blankFromFields<T>(fields: FieldSpec[]): T {
  const o: Record<string, any> = {};
  for (const f of fields) {
    o[f.key] =
      f.type === "number"
        ? null
        : f.type === "select"
          ? typeof f.options?.[0] === "string"
            ? f.options[0]
            : (f.options?.[0] as any)?.value ?? ""
          : "";
  }
  return o as T;
}

export function FieldControl({
  field,
  value,
  onChange,
}: {
  field: FieldSpec;
  value: any;
  onChange: (v: any) => void;
}) {
  switch (field.type) {
    case "textarea":
      return <TextArea value={value ?? ""} onChange={onChange} placeholder={field.placeholder} />;
    case "number":
      return <NumInput value={value ?? null} align="left" onChange={onChange} />;
    case "select":
      return <SelectInput value={value ?? ""} options={field.options ?? []} onChange={onChange} />;
    case "color":
      return <ColorInput value={value ?? ""} onChange={onChange} />;
    case "date":
      return <DateInput value={value ?? ""} onChange={onChange} />;
    default:
      return <TextInput value={value ?? ""} onChange={onChange} placeholder={field.placeholder} />;
  }
}

/** compact read-only preview for a table cell */
export function fieldPreview(field: FieldSpec, value: any): string {
  if (value == null || value === "") return "—";
  if (field.type === "select") {
    const opts = field.options ?? [];
    const hit = opts.find((o) => (typeof o === "string" ? o : o.value) === value);
    return hit ? (typeof hit === "string" ? hit : hit.label) : String(value);
  }
  if (field.type === "color") return String(value);
  const s = String(value);
  return s.length > 60 ? `${s.slice(0, 60)}…` : s;
}
