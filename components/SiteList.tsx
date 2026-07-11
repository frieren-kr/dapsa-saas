"use client";

import { useState, useTransition } from "react";
import { deleteSite, reorderSite } from "@/app/projects/[id]/actions";

interface Site {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  orderIndex: number;
}

interface SiteListProps {
  sites: Site[];
  projectId: string;
  canEdit: boolean;
}

export default function SiteList({ sites, projectId, canEdit }: SiteListProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function handleDelete(siteId: string, name: string) {
    if (!confirm(`"${name}" 답사지를 삭제할까요?`)) return;

    setError(null);
    setPendingId(siteId);
    startTransition(async () => {
      const result = await deleteSite({ siteId, projectId });
      if (result.error) setError(result.error);
      setPendingId(null);
    });
  }

  function handleReorder(siteId: string, direction: "up" | "down") {
    setError(null);
    setPendingId(siteId);
    startTransition(async () => {
      const result = await reorderSite({ siteId, projectId, direction });
      if (result.error) setError(result.error);
      setPendingId(null);
    });
  }

  if (sites.length === 0) {
    return (
      <p className="text-sm text-gray-600">
        {canEdit
          ? "위에서 첫 답사지를 검색해 추가해보세요."
          : "아직 등록된 답사지가 없어요."}
      </p>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <ol className="space-y-2">
        {sites.map((site, index) => {
          const isFirst = index === 0;
          const isLast = index === sites.length - 1;
          const isThisPending = pendingId === site.id && isPending;

          return (
            <li
              key={site.id}
              className="flex items-start gap-3 rounded border p-3"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs text-white">
                {index + 1}
              </span>

              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{site.name}</h3>
                {site.address && (
                  <p className="text-xs text-gray-500">{site.address}</p>
                )}
                <p className="text-xs text-gray-400">
                  {site.latitude.toFixed(6)}, {site.longitude.toFixed(6)}
                </p>
              </div>

              {canEdit && (
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => handleReorder(site.id, "up")}
                    disabled={isFirst || isThisPending}
                    className="rounded border px-2 py-1 text-xs text-gray-700 disabled:opacity-30"
                    title="위로"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReorder(site.id, "down")}
                    disabled={isLast || isThisPending}
                    className="rounded border px-2 py-1 text-xs text-gray-700 disabled:opacity-30"
                    title="아래로"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(site.id, site.name)}
                    disabled={isThisPending}
                    className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 disabled:opacity-30"
                    title="삭제"
                  >
                    삭제
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}