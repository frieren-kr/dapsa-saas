"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { updateSite } from "@/app/projects/[id]/actions";

interface SiteEditorProps {
  site: {
    id: string;
    projectId: string;
    name: string;
    description: string | null;
    address: string | null;
    latitude: number;
    longitude: number;
  };
  canEdit: boolean;
}

export default function SiteEditor({ site, canEdit }: SiteEditorProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(site.name);
  const [description, setDescription] = useState(site.description || "");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!name.trim()) {
      setError("이름을 입력하세요");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateSite({
        siteId: site.id,
        projectId: site.projectId,
        name: name.trim(),
        description: description.trim() || undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setIsEditing(false);
      router.refresh(); // 서버에서 다시 데이터 가져오게
    });
  }

  function handleCancel() {
    // 원래 값으로 되돌리기
    setName(site.name);
    setDescription(site.description || "");
    setError(null);
    setIsEditing(false);
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      {/* 위치 정보 - 항상 표시 */}
      <div className="mb-4 border-b pb-4">
        {site.address && (
          <p className="text-sm text-gray-600">{site.address}</p>
        )}
        <p className="text-xs text-gray-400">
          위도 {site.latitude.toFixed(6)} · 경도 {site.longitude.toFixed(6)}
        </p>
      </div>

      {/* 조회 모드 */}
      {!isEditing && (
        <>
          <div className="mb-4 flex items-start justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{site.name}</h1>
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded border px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
              >
                해설 편집
              </button>
            )}
          </div>

          {site.description ? (
            <div className="prose prose-sm max-w-none text-gray-900">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {site.description}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {canEdit
                ? "아직 해설이 없어요. '해설 편집'을 눌러 작성해보세요."
                : "아직 해설이 없어요."}
            </p>
          )}
        </>
      )}

      {/* 편집 모드 */}
      {isEditing && (
        <>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-900">
              답사지 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="w-full rounded border px-3 py-2 text-gray-900"
            />
          </div>

          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-900">
                해설 (마크다운 형식으로 작성해주세요. ex. **굵게**, *기울임*, [링크](https://...))
              </label>
              <div className="flex gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("edit")}
                  className={`rounded px-2 py-1 ${
                    activeTab === "edit"
                      ? "bg-gray-900 text-white"
                      : "border text-gray-700"
                  }`}
                >
                  편집
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`rounded px-2 py-1 ${
                    activeTab === "preview"
                      ? "bg-gray-900 text-white"
                      : "border text-gray-700"
                  }`}
                >
                  미리보기
                </button>
              </div>
            </div>

            {activeTab === "edit" ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={16}
                maxLength={10000}
                placeholder={`마크다운 문법 예시:
## 소제목
**굵게** *기울임* [링크](https://...)
- 목록 항목
- 다른 항목

| 연대 | 사건 |
| --- | --- |
| 1395 | 경복궁 창건 |`}
                className="w-full rounded border px-3 py-2 font-mono text-sm text-gray-900"
              />
            ) : (
              <div className="min-h-[400px] rounded border bg-gray-50 p-4">
                {description ? (
                  <div className="prose prose-sm max-w-none text-gray-900">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {description}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">
                    미리볼 내용이 없어요
                  </p>
                )}
              </div>
            )}

            <p className="mt-1 text-xs text-gray-500">
              {description.length} / 10000
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="rounded border px-4 py-2 text-sm text-gray-700 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {isPending ? "저장 중..." : "저장"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}