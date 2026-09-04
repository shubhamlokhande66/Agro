"use client";

import { create } from "zustand";

/**
 * Holds admin-uploaded dataset overrides for the current session.
 * Each section reads `overrides[key]` and falls back to its bundled
 * default data when nothing has been uploaded.
 *
 * Kept deliberately generic — the shape of each override is owned by
 * the section that writes it (see src/lib/xlsx.ts parsers).
 */
type UploadMeta = {
  fileName: string;
  loadedAt: number;
  note?: string;
};

type DataStore = {
  overrides: Record<string, unknown>;
  meta: Record<string, UploadMeta>;
  setOverride: (key: string, data: unknown, meta: Omit<UploadMeta, "loadedAt">) => void;
  clearOverride: (key: string) => void;
};

export const useDataStore = create<DataStore>((set) => ({
  overrides: {},
  meta: {},
  setOverride: (key, data, meta) =>
    set((s) => ({
      overrides: { ...s.overrides, [key]: data },
      meta: { ...s.meta, [key]: { ...meta, loadedAt: Date.now() } },
    })),
  clearOverride: (key) =>
    set((s) => {
      const overrides = { ...s.overrides };
      const meta = { ...s.meta };
      delete overrides[key];
      delete meta[key];
      return { overrides, meta };
    }),
}));

/** Typed selector helper */
export function useOverride<T>(key: string): T | undefined {
  return useDataStore((s) => s.overrides[key]) as T | undefined;
}
