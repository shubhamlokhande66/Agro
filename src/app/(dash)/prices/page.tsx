"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedTabs } from "@/components/ui/Tabs";
import { SectionLabel } from "@/components/ui/Card";
import { PriceCard } from "@/components/sections/PriceCard";
import { InternationalPrices } from "@/components/sections/InternationalPrices";
import { VARIETIES, VARIETY_GROUPS } from "@/data/prices";

export default function PricesPage() {
  const [tab, setTab] = useState<"domestic" | "international">("domestic");

  return (
    <div>
      <PageHeader
        title="Prices"
        right={
          <SegmentedTabs
            options={[
              { value: "domestic", label: "Domestic Prices" },
              { value: "international", label: "International Prices" },
            ]}
            value={tab}
            onChange={setTab}
          />
        }
      />

      {tab === "domestic" ? (
        <div>
          {VARIETY_GROUPS.map((group) => (
            <div key={group}>
              <SectionLabel>{group} (₹ / Candy)</SectionLabel>
              <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
                {VARIETIES.filter((v) => v.group === group).map((v) => (
                  <PriceCard key={v.key} v={v} />
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
