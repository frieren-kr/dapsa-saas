"use client";

import { useState, useTransition } from "react";
import { createSchedule } from "@/app/projects/[id]/actions";

interface Site {
  id: string;
  name: string;
}

interface Schedule {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  orderIndex: number;
  siteId: string | null;
  site: {
    id: string;
    name: string;
  } | null;
}

interface ScheduleSectionProps {
  projectId: string;
  sites: Site[];
  schedules: Schedule[];
  canEdit: boolean;
}

export default function ScheduleSection({
  projectId,
  sites,
  schedules,
  canEdit,
}: ScheduleSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [siteId, setSiteId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setTitle("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setSiteId("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createSchedule({
        projectId,
        title: title.trim(),
        date,
        startTime,
        endTime,
        siteId: siteId || undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      resetForm();
      setIsAdding(false);
    });
  }

  // 날짜별 그룹핑
  const grouped = groupByDate(schedules);
  const dateKeys = Object.keys(grouped).sort();

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          일정 ({schedules.length})
        </h2>
        {canEdit && !isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="rounded bg-black px-3 py-1 text-sm text-white"
          >
            + 일정 추가
          </button>
        )}
      </div>

      {/* 추가 폼 */}
      {isAdding && canEdit && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 space-y-3 rounded border border-gray-300 bg-gray-50 p-4"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-900">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={100}
              placeholder="예: 근정전 답사, 점심 식사, 버스 이동"
              className="w-full rounded border px-3 py-2 text-sm text-gray-900"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-900">
                날짜 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded border px-2 py-2 text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-900">
                시작 <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full rounded border px-2 py-2 text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-900">
                종료 <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full rounded border px-2 py-2 text-sm text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-900">
              연결할 답사지 (선택)
            </label>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm text-gray-900"
            >
              <option value="">답사지 없음 (자유 일정)</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="rounded bg-red-50 p-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsAdding(false);
              }}
              disabled={isPending}
              className="rounded border px-3 py-1 text-sm text-gray-700 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-black px-3 py-1 text-sm text-white disabled:opacity-50"
            >
              {isPending ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      )}

      {/* 일정 목록 */}
      {schedules.length === 0 ? (
        <p className="text-sm text-gray-600">
          {canEdit
            ? "일정을 추가하면 여기에 표시돼요."
            : "아직 등록된 일정이 없어요."}
        </p>
      ) : (
        <div className="space-y-4">
          {dateKeys.map((dateKey) => (
            <div key={dateKey}>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                {formatDate(dateKey)}
              </h3>
              <ol className="space-y-1">
                {grouped[dateKey].map((schedule) => (
                  <li
                    key={schedule.id}
                    className="flex items-center gap-3 rounded border border-gray-200 p-3"
                  >
                    <div className="w-24 shrink-0 text-xs text-gray-500">
                      {schedule.startTime} – {schedule.endTime}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {schedule.title}
                      </p>
                      {schedule.site && (
                        <p className="text-xs text-blue-600">
                          → {schedule.site.name}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 헬퍼: 날짜별 그룹핑
function groupByDate(schedules: Schedule[]): Record<string, Schedule[]> {
  const result: Record<string, Schedule[]> = {};
  for (const s of schedules) {
    const key = new Date(s.date).toISOString().split("T")[0];
    if (!result[key]) result[key] = [];
    result[key].push(s);
  }
  return result;
}

// 헬퍼: 날짜 표시 포맷
function formatDate(dateKey: string): string {
  const d = new Date(dateKey);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}