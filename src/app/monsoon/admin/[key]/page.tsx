"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DatasetEditor } from "@/components/admin/DatasetEditor";
import { AdminGate } from "@/components/monsoon/AdminGate";
import { useMonsoon } from "@/components/monsoon/data";
import { datasetApp } from "@/lib/datasets/registry";

type MetaRow = { key: string; updatedAt: number | null; updatedBy: string | null };

/** weather admin: edit one weather dataset (same editor as the cotton admin, separate area) */
export default function WeatherDatasetEditorPage() {
  const { key } = useParams<{ key: string }>();
  const { reload } = useMonsoon();
  const [rowMeta, setRowMeta] = useState<MetaRow | undefined>();

  const loadMeta = useCallback(
    () =>
      fetch("/api/admin/meta?app=weather")
        .then((r) => r.json())
        .then((d) => setRowMeta((d.rows ?? []).find((r: MetaRow) => r.key === key)))
        .catch(() => {}),
    [key],
  );
  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  return (
    <AdminGate>
      <Link href="/monsoon/admin" className="mb-3 inline-block text-[12px] text-ink-faint hover:text-ink">
        ← Weather admin
      </Link>
      {datasetApp(key) === "weather" ? (
        <DatasetEditor
          datasetKey={key}
          rowMeta={rowMeta}
          onSaved={async () => {
            await loadMeta();
            reload();
          }}
        />
      ) : (
        <p className="text-sm text-ink-faint">That isn't a weather dataset.</p>
      )}
    </AdminGate>
  );
}
