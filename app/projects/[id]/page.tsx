import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { canAccessProject, isProjectOrganizer } from "@/lib/permissions";
import SiteRegisterMap from "@/components/SiteRegisterMap";
import Link from "next/link";
import SiteList from "@/components/SiteList";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const { id } = await params;

  // 접근 권한 확인
  const hasAccess = await canAccessProject(session.user.id, id);
  if (!hasAccess) notFound();

  // 프로젝트 + 답사지 목록 함께 조회
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      sites: {
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!project) notFound();

  // 편집 권한(추가·수정·삭제)은 organizer만
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
            <p className="text-sm text-gray-700">{project.description}</p>
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

          <SiteList
            sites={project.sites}
            projectId={project.id}
            canEdit={canEdit}
          />
        </div>
      </div>
    </div>
  );
}