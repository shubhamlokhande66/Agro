"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedTabs } from "@/components/ui/Tabs";
import { SectionLabel } from "@/components/ui/Card";
import { UploadPanel } from "@/components/ui/UploadPanel";
import { PriceCard } from "@/components/sections/PriceCard";
import { InternationalPrices } from "@/components/sections/InternationalPrices";
import {
  VARIETIES,
  VARIETY_GROUPS,
  DOM_YEARS,
  PRICES_STORE_KEY,
  applyPriceOverride,
  type PriceOverride,
} from "@/data/prices";
import { useOverride } from "@/lib/store";
import { parsePrices } from "@/lib/xlsx";

export default function PricesPage() {
  const [tab, setTab] = useState<"domestic" | "international">("domestic");
  const override = useOverride<PriceOverride>(PRICES_STORE_KEY);

  const varieties = useMemo(
    () => applyPriceOverride(VARIETIES, override),
    [override],
  );
  const years = override?.years?.length ? override.years : DOM_YEARS;

  return (
    <div>
      <PageHeader
        title="Prices"
        icon="₹"
        right={
          <SegmentedTabs
            options={[
              { value: "domestic", label: "Domestic" },
              { value: "international", label: "International" },
            ]}
            value={tab}
            onChange={setTab}
          />
        }
      />

      {tab === "domestic" ? (
        <div className="space-y-2">
          <UploadPanel
            storeKey={PRICES_STORE_KEY}
            title="Update domestic prices"
            hint="Sheet with a Year column + variety columns (GUJ29, MMAK29, PHR28…)"
            parse={parsePrices}
          />
          {VARIETY_GROUPS.map((group) => (
            <div key={group}>
              <SectionLabel>{group} · ₹ / Candy</SectionLabel>
              <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
                {varieties
                  .filter((v) => v.group === group)
                  .map((v) => (
                    <PriceCard key={v.key} v={v} years={years} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <InternationalPrices />
      )}
    </div>
  );
}
