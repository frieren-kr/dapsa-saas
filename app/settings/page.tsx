import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getDeletionImpact } from "@/lib/account";
import DeleteAccountSection from "@/components/DeleteAccountSection";
import Link from "next/link";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const impact = await getDeletionImpact(session.user.id);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-2xl px-4">
        <Link
          href="/dashboard"
          className="mb-4 inline-block text-sm text-gray-600 hover:underline"
        >
          ← 대시보드
        </Link>

        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">설정</h1>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">이름</span>
              <span className="text-gray-900">{session.user.name}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">이메일</span>
              <span className="text-gray-900">{session.user.email}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-gray-500">역할</span>
              <span className="text-gray-900">
                {session.user.role === "ORGANIZER"
                  ? "답사 준비기관"
                  : session.user.role === "PARTICIPANT"
                  ? "답사 참여자"
                  : "관리자"}
              </span>
            </div>
          </div>
        </div>

        {/* 위험 구역 - 탈퇴 */}
        <div className="rounded-lg border border-red-200 bg-white p-6 shadow">
          <h2 className="mb-2 text-lg font-semibold text-red-700">
            회원 탈퇴
          </h2>
          <DeleteAccountSection
            impact={{
              ownedProjectCount: impact.ownedProjectCount,
              affectedMembers: impact.affectedMembers,
              joinedCount: impact.joinedCount,
              ownedProjects: impact.ownedProjects.map((p) => ({
                id: p.id,
                title: p.title,
                memberCount: p._count.members,
              })),
            }}
          />
        </div>
      </div>
    </div>
  );
}