"use client";

import { Tabs } from "./Tabs";
import { GLOBAL_PERIOD_OPTS, type GlobalPeriod } from "@/lib/period";

/** The page-level 1W/1M/6M/1Y/5Y filter from the dashboard requirements doc — one per page,
 *  usually placed in `PageHeader`'s `right` slot. */
export function GlobalPeriodTabs({
  value,
  onChange,
}: {
  value: GlobalPeriod;
  onChange: (v: GlobalPeriod) => void;
}) {
  return <Tabs options={GLOBAL_PERIOD_OPTS} value={value} onChange={onChange} />;
}
