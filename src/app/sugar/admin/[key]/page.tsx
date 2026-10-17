"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DatasetEditor } from "@/components/admin/DatasetEditor";
import { SugarAdminGate } from "@/components/sugar/SugarAdminGate";
import { useSugarData } from "@/components/sugar/SugarData";
import { datasetApp } from "@/lib/datasets/registry";

type MetaRow = { key: string; updatedAt: number | null; updatedBy: string | null };

/** sugar admin: edit one sugar dataset (the same editor as the cotton admin) */
export default function SugarDatasetEditorPage() {
  const { key } = useParams<{ key: string }>();
  const { reload } = useSugarData();
  const [rowMeta, setRowMeta] = useState<MetaRow | undefined>();

  const loadMeta = useCallback(
    () =>
      fetch("/api/admin/meta?app=sugar")
        .then((r) => r.json())
        .then((d) => setRowMeta((d.rows ?? []).find((r: MetaRow) => r.key === key)))
        .catch(() => {}),
    [key],
  );
  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  return (
    <SugarAdminGate>
      <Link href="/sugar/admin" className="mb-3 inline-block text-[12px] text-ink-faint hover:text-ink">
        ← Sugar admin
      </Link>
      {datasetApp(key) === "sugar" ? (
        <DatasetEditor
          datasetKey={key}
          rowMeta={rowMeta}
          onSaved={async () => {
            await loadMeta();
            await reload();
          }}
        />
      ) : (
        <p className="text-sm text-ink-faint">That isn&apos;t a sugar dataset.</p>
      )}
    </SugarAdminGate>
  );
}
