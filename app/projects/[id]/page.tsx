import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { canAccessProject, isProjectOrganizer } from "@/lib/permissions";
import SiteRegisterMap from "@/components/SiteRegisterMap";
import Link from "next/link";
import SiteList from "@/components/SiteList";
import ScheduleSection from "@/components/ScheduleSection";
import InvitationManager from "@/components/InvitationManager";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const { id } = await params;

  const hasAccess = await canAccessProject(session.user.id, id);
  if (!hasAccess) notFound();

  const project = await prisma.project.findUnique({
  where: { id },
  include: {
    sites: {
      orderBy: { orderIndex: "asc" },
    },
    schedules: {
      orderBy: [{ date: "asc" }, { orderIndex: "asc" }],
      include: {
        site: { select: { id: true, name: true } },
      },
    },
    invitations: {
      orderBy: { createdAt: "desc" },
    },
    members: {
      orderBy: { joinedAt: "asc" },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    },
  },
});

  if (!project) notFound();

  const canEdit = await isProjectOrganizer(session.user.id, id);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-5xl px-4">
        <Link
          href="/dashboard"
          className="mb-4 inline-block text-sm text-gray-600 hover:underline"
        >
          ← 대시보드
        </Link>

        {/* 프로젝트 헤더 */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
              {project.status === "DRAFT"
                ? "준비 중"
                : project.status === "PUBLISHED"
                ? "공개"
                : "완료"}
            </span>
          </div>
          {project.description && (
            <p className="mb-3 text-sm text-gray-700">{project.description}</p>
          )}
          {canEdit && (
            <Link
              href={`/projects/${project.id}/edit`}
              className="rounded border px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
            >
              수정
            </Link>
          )}
        </div>

        {/* 답사지 등록 UI (organizer만) */}
        {canEdit && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              답사지 추가
            </h2>
            <SiteRegisterMap projectId={project.id} />
          </div>
        )}

        {/* 등록된 답사지 목록 */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            등록된 답사지 ({project.sites.length})
          </h2>
          <p className="mb-3 text-sm text-gray-600">
            답사지를 클릭하여 해당 답사지의 해설을 작성하거나 수정할 수 있습니다.
          </p>
          <SiteList
            sites={project.sites}
            projectId={project.id}
            canEdit={canEdit}
          />
        </div>

      
        {/* 일정 섹션 */}
        <div className="mt-6">
          <ScheduleSection
            projectId={project.id}
            sites={project.sites.map((s) => ({ id: s.id, name: s.name }))}
            schedules={project.schedules}
            canEdit={canEdit}
          />
        </div>
        {/* 초대 관리 (organizer만) */}
        {canEdit && (
          <div className="mt-6">
            <InvitationManager
              projectId={project.id}
              invitations={project.invitations.map((inv) => ({
                ...inv,
                daysLeft: Math.ceil(
                  (new Date(inv.expiresAt).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                ),
              }))}
              members={project.members}
            />
          </div>
      )}
      </div>
    </div>
  );
}
