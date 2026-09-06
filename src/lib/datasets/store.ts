"use client";

import { create } from "zustand";

type DataState = {
  ready: boolean;
  version: number;
  error: string | null;
  bump: () => void;
  setReady: () => void;
  setError: (e: string) => void;
};

export const useDataState = create<DataState>((set) => ({
  ready: false,
  version: 0,
  error: null,
  bump: () => set((s) => ({ version: s.version + 1 })),
  setReady: () => set({ ready: true, error: null }),
  setError: (e) => set({ error: e }),
}));
