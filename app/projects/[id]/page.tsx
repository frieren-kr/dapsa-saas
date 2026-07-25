import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { canAccessProject, isProjectOrganizer } from "@/lib/permissions";
import SiteRegisterMap from "@/components/SiteRegisterMap";
import Link from "next/link";
import SiteList from "@/components/SiteList";
import ScheduleSection from "@/components/ScheduleSection";
import InvitationManager from "@/components/InvitationManager";
import ProjectMap from "@/components/ProjectMap";

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
      organizer: {
        select: { name: true },
      },
    },
  });

  if (!project) notFound();

  const canEdit = await isProjectOrganizer(session.user.id, id);

  // 날짜 표시 헬퍼
  const formatDate = (d: Date | null) =>
    d
      ? new Date(d).toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : null;

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10">
      <div className="mx-auto max-w-5xl px-4">
        <Link
          href="/dashboard"
          className="mb-4 inline-block text-sm text-gray-600 hover:underline"
        >
          ← 대시보드
        </Link>

        {/* 프로젝트 헤더 */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {project.title}
                </h1>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                  {project.status === "DRAFT"
                    ? "준비 중"
                    : project.status === "PUBLISHED"
                    ? "공개"
                    : "완료"}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {project.organizer.name} 님이 준비했어요
              </p>
            </div>
            {canEdit && (
              <Link
                href={`/projects/${project.id}/edit`}
                className="shrink-0 rounded border px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
              >
                수정
              </Link>
            )}
          </div>

          {project.description && (
            <p className="mb-3 whitespace-pre-line text-sm text-gray-700">
              {project.description}
            </p>
          )}

          {(project.startDate || project.endDate) && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
              {project.startDate && (
                <span>시작: {formatDate(project.startDate)}</span>
              )}
              {project.endDate && (
                <span>종료: {formatDate(project.endDate)}</span>
              )}
              <span>답사지 {project.sites.length}곳</span>
              {canEdit && <span>참여자 {project.members.length}명</span>}
            </div>
          )}
        </div>

        {/* 전체 동선 지도 - 답사지 있을 때만 */}
        {project.sites.length > 0 && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              전체 동선
            </h2>
            <ProjectMap sites={project.sites} height="400px" />
            <p className="mt-2 text-xs text-gray-500">
              지도의 번호를 눌러 답사지 순서를 확인할 수 있어요.
            </p>
          </div>
        )}

        {/* 일정 섹션 */}
        <div className="mb-6">
          <ScheduleSection
            projectId={project.id}
            sites={project.sites.map((s) => ({ id: s.id, name: s.name }))}
            schedules={project.schedules}
            canEdit={canEdit}
          />
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
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            답사지 목록 ({project.sites.length})
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            답사지 이름을 눌러 해설을 확인하세요.
          </p>
          <SiteList
            sites={project.sites}
            projectId={project.id}
            canEdit={canEdit}
          />
        </div>

        {/* 초대 관리 (organizer만) */}
        {canEdit && (
          <div className="mb-6">
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