import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  const params = await searchParams;
  const justCreated = params.created;

  // 준비기관: 본인이 만든 프로젝트 목록
  // 참여자: 참가한 프로젝트 목록 (아직 초대 시스템 없어서 비어있을 예정)
  // 관리자: 별도 처리 (하단에서)

  const projects =
    session.user.role === "ORGANIZER"
      ? await prisma.project.findMany({
          where: { organizerId: session.user.id },
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: { sites: true, members: true },
            },
          },
        })
      : session.user.role === "PARTICIPANT"
      ? await prisma.project.findMany({
          where: {
            members: { some: { userId: session.user.id } },
          },
          orderBy: { startDate: "asc" },
          include: {
            _count: {
              select: { sites: true },
            },
          },
        })
      : [];

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-4xl px-4">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
            <p className="text-sm text-gray-600">
              {session.user.name}님 ·{" "}
              {session.user.role === "ORGANIZER"
                ? "답사 준비기관"
                : session.user.role === "PARTICIPANT"
                ? "답사 참여자"
                : "관리자"}
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-gray-600 hover:underline"
          >
            메인
          </Link>
        </div>

        {/* 방금 생성됨 알림 */}
        {justCreated && (
          <div className="mb-4 rounded bg-green-50 p-3 text-sm text-green-800">
            프로젝트가 생성되었어요.
          </div>
        )}

        {/* 관리자 뷰 */}
        {session.user.role === "ADMIN" && (
          <div className="rounded-lg bg-white p-8 shadow">
            <p className="text-gray-700">
              관리자 어드민 페이지는 준비 중이에요.
            </p>
          </div>
        )}

        {/* 준비기관 뷰 */}
        {session.user.role === "ORGANIZER" && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                내 프로젝트 ({projects.length})
              </h2>
              <Link
                href="/projects/new"
                className="rounded bg-black px-4 py-2 text-sm text-white"
              >
                + 새 프로젝트
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="rounded-lg bg-white p-8 text-center shadow">
                <p className="mb-4 text-gray-600">
                  아직 만든 프로젝트가 없어요.
                </p>
                <Link
                  href="/projects/new"
                  className="inline-block rounded bg-black px-4 py-2 text-sm text-white"
                >
                  첫 프로젝트 만들기
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    role="ORGANIZER"
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* 참여자 뷰 */}
        {session.user.role === "PARTICIPANT" && (
          <>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              참여 중인 답사 ({projects.length})
            </h2>

            {projects.length === 0 ? (
              <div className="rounded-lg bg-white p-8 text-center shadow">
                <p className="text-gray-600">
                  아직 초대받은 답사가 없어요.
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  준비기관에서 초대 링크를 받으면 여기에 표시돼요.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    role="PARTICIPANT"
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// 프로젝트 카드 컴포넌트 (같은 파일 안에 둠)
function ProjectCard({
  project,
  role,
}: {
  project: {
    id: string;
    title: string;
    description: string | null;
    startDate: Date | null;
    endDate: Date | null;
    status: string;
    _count: { sites: number; members?: number };
  };
  role: "ORGANIZER" | "PARTICIPANT";
}) {
  const statusLabel =
    project.status === "DRAFT"
      ? "준비 중"
      : project.status === "PUBLISHED"
      ? "공개"
      : "완료";

  const statusColor =
    project.status === "DRAFT"
      ? "bg-gray-100 text-gray-700"
      : project.status === "PUBLISHED"
      ? "bg-blue-100 text-blue-700"
      : "bg-green-100 text-green-700";

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-lg bg-white p-4 shadow hover:shadow-md"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900">{project.title}</h3>
        <span className={`shrink-0 rounded px-2 py-0.5 text-xs ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {project.description && (
        <p className="mb-3 line-clamp-2 text-sm text-gray-600">
          {project.description}
        </p>
      )}

      <div className="flex gap-3 text-xs text-gray-500">
        <span>답사지 {project._count.sites}개</span>
        {role === "ORGANIZER" && project._count.members !== undefined && (
          <span>참여자 {project._count.members}명</span>
        )}
        {project.startDate && (
          <span>
            {new Date(project.startDate).toLocaleDateString("ko-KR")}
          </span>
        )}
      </div>
    </Link>
  );
}