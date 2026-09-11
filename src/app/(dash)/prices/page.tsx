"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedTabs } from "@/components/ui/Tabs";
import { SectionLabel } from "@/components/ui/Card";
import { PriceCard } from "@/components/sections/PriceCard";
import { InternationalPrices } from "@/components/sections/InternationalPrices";
import { AdminHint } from "@/components/ui/AdminHint";
import { DataMissing } from "@/components/ui/DataGuard";
import { VARIETIES, VARIETY_GROUPS } from "@/data/prices";

export default function PricesPage() {
  const [tab, setTab] = useState<"domestic" | "international">("domestic");
  const groups =
    VARIETY_GROUPS.length > 0
      ? VARIETY_GROUPS
      : Array.from(new Set(VARIETIES.map((v) => v.group)));

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
        VARIETIES.length === 0 ? (
          <DataMissing title="Prices" icon="₹" dataset="prices" />
        ) : (
          <div>
            <AdminHint dataset="prices" />
            {groups.map((group) => (
              <div key={group}>
                <SectionLabel>{group} · ₹ / Candy</SectionLabel>
                <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
                  {VARIETIES.filter((v) => v.group === group).map((v) => (
                    <PriceCard key={v.key} v={v} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <InternationalPrices />
      )}
    </div>
  );
}
