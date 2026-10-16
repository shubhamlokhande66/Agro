"use client";

import { useParams, useRouter } from "next/navigation";
import { DatasetEditor } from "@/components/admin/DatasetEditor";
import { useDatasets } from "@/lib/datasets/provider";
import { useAdminMeta } from "@/lib/admin/context";

/** cotton admin: edit one dataset */
export default function DatasetEditorPage() {
  const { key } = useParams<{ key: string }>();
  const router = useRouter();
  const { refresh } = useDatasets();
  const { meta, refresh: refreshAdminMeta } = useAdminMeta();
  return (
    <DatasetEditor
      datasetKey={key}
      rowMeta={meta[key]}
      onSaved={async () => {
        await Promise.all([refresh(), refreshAdminMeta()]);
        router.refresh();
      }}
    />
  );
}
