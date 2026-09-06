/** Curated market-news feed — loaded from the database. */

export type NewsItem = { tag: string; tone: string; text: string; meta: string };
export type NewsBlob = { items: NewsItem[] };

export let NEWS_ITEMS: NewsItem[] = [];

export function __hydrateNews(b: NewsBlob) {
  NEWS_ITEMS = b.items ?? [];
}

export const NEWS_TONES = ["accent", "info", "warn", "violet", "neg"] as const;
