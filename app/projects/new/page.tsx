import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { createProject } from "../actions";
import Link from "next/link";

export default async function NewProjectPage() {
  const session = await getSession();

  // 로그인 안 했으면 로그인 페이지로
  if (!session) {
    redirect("/sign-in");
  }

  // ORGANIZER가 아니면 대시보드로 (참여자는 이 페이지 접근 불가)
  if (session.user.role !== "ORGANIZER") {
    redirect("/dashboard");
  }


  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 hover:underline"
          >
            ← 대시보드로
          </Link>
        </div>

        <div className="rounded-lg bg-white p-8 shadow">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">
            새 답사 프로젝트
          </h1>

          <form action={createProject} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900">
                프로젝트 제목 <span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                type="text"
                required
                maxLength={100}
                placeholder="예: 2026 봄 경주 답사"
                className="w-full rounded border px-3 py-2 text-gray-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900">
                답사 개요
              </label>
              <textarea
                name="description"
                rows={4}
                maxLength={1000}
                placeholder="답사 목적, 주제 등을 간단히 적어주세요"
                className="w-full rounded border px-3 py-2 text-gray-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">
                  시작일
                </label>
                <input
                  name="startDate"
                  type="date"
                  className="w-full rounded border px-3 py-2 text-gray-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">
                  종료일
                </label>
                <input
                  name="endDate"
                  type="date"
                  className="w-full rounded border px-3 py-2 text-gray-900"
                />
              </div>
            </div>

            <div className="rounded bg-blue-50 p-3 text-sm text-blue-900">
              프로젝트를 만든 뒤 답사지·일정·해설을 추가하고 참여자를 초대할 수 있어요.
            </div>

            <div className="flex gap-2 pt-2">
              <Link
                href="/dashboard"
                className="rounded border px-4 py-2 text-sm text-gray-700"
              >
                취소
              </Link>
              <button
                type="submit"
                className="rounded bg-black px-4 py-2 text-sm text-white"
              >
                프로젝트 만들기
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}