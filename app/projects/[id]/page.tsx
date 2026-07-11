import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { canAccessProject } from "@/lib/permissions";
import Link from "next/link";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const { id } = await params;

  // 권한 검사 - 이 프로젝트에 접근 가능한가?
  const hasAccess = await canAccessProject(session.user.id, id);
  if (!hasAccess) {
    notFound(); // 존재 여부도 알리지 않음
  }

  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) notFound();

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-3xl px-4">
        <Link
          href="/dashboard"
          className="mb-4 inline-block text-sm text-gray-600 hover:underline"
        >
          ← 대시보드
        </Link>

        <div className="rounded-lg bg-white p-8 shadow">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            {project.title}
          </h1>
          {project.description && (
            <p className="mb-4 text-gray-700">{project.description}</p>
          )}
          <p className="text-sm text-gray-500">상태: {project.status}</p>

          <div className="mt-6 rounded bg-yellow-50 p-3 text-sm text-yellow-900">
            프로젝트 관리 기능(답사지·일정·초대)은 다음 단계에서 만들 예정이에요.
          </div>
        </div>
      </div>
    </div>
  );
}