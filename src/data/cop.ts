/** Cost of production & ROI by crop — loaded from the database. */

type CropBlock = {
  years: string[];
  cost_components: Record<string, number[]>;
  totals: {
    total_cost: number[]; yield: number[]; price: number[];
    gross_return: number[]; net_return: number[]; roi: number[];
  };
};
export type CopData = Record<string, CropBlock>;
export type CopBlob = { data: CopData; emoji: Record<string, string> };

export let COP_DATA: CopData = {};
export let COP_CROPS: string[] = [];
export let COP_EMOJI: Record<string, string> = {};

export function __hydrateCop(b: CopBlob) {
  COP_DATA = b.data ?? {};
  COP_CROPS = Object.keys(COP_DATA);
  COP_EMOJI = b.emoji ?? {};
}
