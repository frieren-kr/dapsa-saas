"use client";

import { useState, useTransition } from "react";
import ProjectMap from "./ProjectMap";
import { updateProjectRoute } from "@/app/projects/[id]/actions";

interface RouteStop {
  siteId: string;
  name: string;
  latitude: number;
  longitude: number;
  date: string; // "YYYY-MM-DD"
}

interface DateRoute {
  path: number[][];
  distance: number;
  duration: number;
}

interface RouteViewProps {
  projectId: string;
  canEdit: boolean;
  stops: RouteStop[];                        // 전체(날짜 무관) 일정순 답사지
  routeData: Record<string, DateRoute> | null; // 날짜별 경로
  routeIsStale: boolean;
}

export default function RouteView({
  projectId,
  canEdit,
  stops,
  routeData,
  routeIsStale,
}: RouteViewProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // 날짜별로 stops 그룹핑
  const dateKeys = Array.from(new Set(stops.map((s) => s.date))).sort();
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const effectiveDate =
    activeDate && dateKeys.includes(activeDate)
      ? activeDate
      : dateKeys[0] ?? null;

  const activeStops = effectiveDate
    ? stops.filter((s) => s.date === effectiveDate)
    : [];
  const activeRoute =
    effectiveDate && routeData ? routeData[effectiveDate] ?? null : null;

  function handleCalculate() {
    setError(null);
    startTransition(async () => {
      const result = await updateProjectRoute({ projectId });
      if (result.error) setError(result.error);
    });
  }

  function fmtDistance(m: number) {
    return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`;
  }
  function fmtDuration(ms: number) {
    const min = Math.round(ms / 60000);
    const h = Math.floor(min / 60);
    const r = min % 60;
    return h > 0 ? `${h}시간 ${r}분` : `${r}분`;
  }

  function fmtDateLabel(key: string) {
    return new Date(key).toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  }

  if (stops.length === 0) {
    return (
      <div className="rounded border bg-gray-50 p-6 text-center text-sm text-gray-500">
        답사지가 연결된 일정이 없어요. 일정에 답사지를 연결하면 동선이
        표시됩니다.
      </div>
    );
  }

  return (
    <div>
      {/* 경로 계산 버튼 + 낡음 안내 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {routeData
            ? "날짜별 이동 경로예요."
            : "아직 경로가 계산되지 않았어요."}
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={handleCalculate}
            disabled={isPending}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            {isPending
              ? "계산 중..."
              : routeData
              ? "경로 다시 계산"
              : "차량 경로 계산"}
          </button>
        )}
      </div>

      {canEdit && routeIsStale && routeData && (
        <div className="mb-3 rounded bg-yellow-50 p-2 text-xs text-yellow-800">
          일정이나 답사지가 변경됐어요. 경로를 다시 계산해주세요.
        </div>
      )}

      {error && (
        <div className="mb-3 rounded bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* 날짜 탭 */}
      {dateKeys.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-1 border-b">
          {dateKeys.map((key) => {
            const isActive = key === effectiveDate;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveDate(key)}
                className={`-mb-px border-b-2 px-3 py-2 text-sm ${
                  isActive
                    ? "border-black font-medium text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                {fmtDateLabel(key)}
              </button>
            );
          })}
        </div>
      )}

      {/* 선택 날짜의 거리·시간 */}
      {activeRoute && (
        <div className="mb-3 flex gap-4 text-sm">
          <span className="text-gray-900">
            이동거리 <strong>{fmtDistance(activeRoute.distance)}</strong>
          </span>
          <span className="text-gray-900">
            예상 소요 <strong>{fmtDuration(activeRoute.duration)}</strong>
          </span>
        </div>
      )}

      {/* 지도 */}
      <ProjectMap
        stops={activeStops.map((s) => ({
          siteId: s.siteId,
          name: s.name,
          latitude: s.latitude,
          longitude: s.longitude,
        }))}
        routePath={activeRoute?.path ?? null}
        height="400px"
      />

      {activeRoute && (
        <p className="mt-2 text-xs text-gray-500">
          차량 이동 기준 예상치입니다. 실제 교통상황에 따라 달라질 수 있어요.
        </p>
      )}
    </div>
  );
}