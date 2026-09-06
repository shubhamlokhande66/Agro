import { __hydratePrices } from "@/data/prices";
import { __hydrateInternational } from "@/data/international";
import { __hydrateCurrency } from "@/data/currency";
import { __hydrateArrivals } from "@/data/arrivals";
import { __hydrateSowing } from "@/data/sowing";
import { __hydrateProduction } from "@/data/production";
import { __hydrateBalanceSheet } from "@/data/balanceSheet";
import { __hydrateTrade } from "@/data/trade";
import { __hydrateCci } from "@/data/cci";
import { __hydrateRainfall } from "@/data/rainfall";
import { __hydrateCop } from "@/data/cop";
import { __hydrateCalendar } from "@/data/calendar";
import { __hydrateWasde } from "@/data/wasde";
import { __hydrateNews } from "@/data/news";

const HYDRATORS: Record<string, (blob: any) => void> = {
  prices: __hydratePrices,
  international: __hydrateInternational,
  currency: __hydrateCurrency,
  arrivals: __hydrateArrivals,
  sowing: __hydrateSowing,
  production: __hydrateProduction,
  balanceSheet: __hydrateBalanceSheet,
  trade: __hydrateTrade,
  cci: __hydrateCci,
  rainfall: __hydrateRainfall,
  cop: __hydrateCop,
  calendar: __hydrateCalendar,
  wasde: __hydrateWasde,
  news: __hydrateNews,
};

export function hydrateAll(blobs: Record<string, unknown>) {
  for (const [key, fn] of Object.entries(HYDRATORS)) {
    const blob = blobs[key];
    if (blob != null) {
      try {
        fn(blob);
      } catch (e) {
        console.error(`hydrate ${key} failed`, e);
      }
    }
  }
}
